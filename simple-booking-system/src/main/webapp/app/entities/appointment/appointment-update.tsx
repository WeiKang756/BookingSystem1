import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button, Col, FormText, Row, Alert } from 'reactstrap';
import { Translate, ValidatedField, ValidatedForm, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getUsers } from 'app/modules/administration/user-management/user-management.reducer';
import { getEntities as getServices } from 'app/entities/service/service.reducer';
import { AppointmentStatus } from 'app/shared/model/enumerations/appointment-status.model';
import { createEntity, getEntity, reset, updateEntity } from './appointment.reducer';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';

export const AppointmentUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const users = useAppSelector(state => state.userManagement.users);
  const services = useAppSelector(state => state.service.entities);
  const appointmentEntity = useAppSelector(state => state.appointment.entity);
  const loading = useAppSelector(state => state.appointment.loading);
  const updating = useAppSelector(state => state.appointment.updating);
  const updateSuccess = useAppSelector(state => state.appointment.updateSuccess);
  const appointmentStatusValues = Object.keys(AppointmentStatus);
  const account = useAppSelector(state => state.authentication.account);
  const isAdmin = hasAnyAuthority(account.authorities, [AUTHORITIES.ADMIN]);

  const [errorMessage, setErrorMessage] = useState('');
  const searchParams = new URLSearchParams(location.search);
  const serviceIdFromUrl = searchParams.get('serviceId');
  const startTimeFromUrl = searchParams.get('startTime');
  const endTimeFromUrl = searchParams.get('endTime');

  const handleClose = () => {
    navigate(`/appointment${location.search}`);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getUsers({}));
    dispatch(getServices({}));
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = values => {
    if (values.id !== undefined && typeof values.id !== 'number') {
      values.id = Number(values.id);
    }
    values.startTime = convertDateTimeToServer(values.startTime);
    values.endTime = convertDateTimeToServer(values.endTime);

    // For new appointments by regular users, always set status to REQUESTED
    if (isNew && !isAdmin) {
      values.status = 'REQUESTED';
    }

    // For existing appointments, ensure non-admins can't change status
    if (!isNew && !isAdmin && appointmentEntity.status !== values.status) {
      setErrorMessage('Only administrators can change appointment status');
      return;
    }

    const entity = {
      ...appointmentEntity,
      ...values,
      user: users.find(it => it.id.toString() === values.user?.toString()),
      service: services.find(it => it.id.toString() === values.service?.toString()),
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const defaultValues = () => {
    if (isNew) {
      // If values are passed via URL, use them for the form
      const defaultStartTime = startTimeFromUrl ? convertDateTimeFromServer(startTimeFromUrl) : displayDefaultDateTime();
      const defaultEndTime = endTimeFromUrl ? convertDateTimeFromServer(endTimeFromUrl) : displayDefaultDateTime();

      return {
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        status: 'REQUESTED',
        user: account.id,
        service: serviceIdFromUrl || '',
      };
    } else {
      return {
        ...appointmentEntity,
        startTime: convertDateTimeFromServer(appointmentEntity.startTime),
        endTime: convertDateTimeFromServer(appointmentEntity.endTime),
        user: appointmentEntity?.user?.id,
        service: appointmentEntity?.service?.id,
      };
    }
  };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="simpleBookingSystemApp.appointment.home.createOrEditLabel" data-cy="AppointmentCreateUpdateHeading">
            <Translate contentKey="simpleBookingSystemApp.appointment.home.createOrEditLabel">Create or edit a Appointment</Translate>
          </h2>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md="8">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {errorMessage && (
                <Alert color="danger" className="mb-3">
                  {errorMessage}
                </Alert>
              )}
              <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
                {!isNew ? (
                  <ValidatedField
                    name="id"
                    required
                    readOnly
                    id="appointment-id"
                    label={translate('global.field.id')}
                    validate={{ required: true }}
                  />
                ) : null}
                <ValidatedField
                  label={translate('simpleBookingSystemApp.appointment.startTime')}
                  id="appointment-startTime"
                  name="startTime"
                  data-cy="startTime"
                  type="datetime-local"
                  placeholder="YYYY-MM-DD HH:mm"
                  validate={{
                    required: { value: true, message: translate('entity.validation.required') },
                  }}
                />
                <ValidatedField
                  label={translate('simpleBookingSystemApp.appointment.endTime')}
                  id="appointment-endTime"
                  name="endTime"
                  data-cy="endTime"
                  type="datetime-local"
                  placeholder="YYYY-MM-DD HH:mm"
                  validate={{
                    required: { value: true, message: translate('entity.validation.required') },
                  }}
                />
                <ValidatedField
                  label={translate('simpleBookingSystemApp.appointment.status')}
                  id="appointment-status"
                  name="status"
                  data-cy="status"
                  type="select"
                  disabled={!isAdmin}
                >
                  {appointmentStatusValues.map(appointmentStatus => (
                    <option value={appointmentStatus} key={appointmentStatus}>
                      {translate(`simpleBookingSystemApp.AppointmentStatus.${appointmentStatus}`)}
                    </option>
                  ))}
                </ValidatedField>
                {!isAdmin && (
                  <FormText color="muted" className="mb-3">
                    Only administrators can change the appointment status.
                  </FormText>
                )}
                <ValidatedField
                  label={translate('simpleBookingSystemApp.appointment.specialNeeds')}
                  id="appointment-specialNeeds"
                  name="specialNeeds"
                  data-cy="specialNeeds"
                  type="textarea"
                  placeholder="Enter any special needs or requirements"
                />
                <ValidatedField
                  id="appointment-user"
                  name="user"
                  data-cy="user"
                  label={translate('simpleBookingSystemApp.appointment.user')}
                  type="select"
                  required
                  disabled={!isAdmin && !isNew}
                >
                  <option value="" key="0" />
                  {users
                    ? users.map(otherEntity => (
                        <option value={otherEntity.id} key={otherEntity.id} selected={!isAdmin && !isNew && account.id === otherEntity.id}>
                          {otherEntity.login}
                        </option>
                      ))
                    : null}
                </ValidatedField>
                <FormText>
                  <Translate contentKey="entity.validation.required">This field is required.</Translate>
                </FormText>
                <ValidatedField
                  id="appointment-service"
                  name="service"
                  data-cy="service"
                  label={translate('simpleBookingSystemApp.appointment.service')}
                  type="select"
                >
                  <option value="" key="0" />
                  {services
                    ? services.map(otherEntity => (
                        <option
                          value={otherEntity.id}
                          key={otherEntity.id}
                          selected={serviceIdFromUrl && serviceIdFromUrl === otherEntity.id.toString()}
                        >
                          {otherEntity.name}
                        </option>
                      ))
                    : null}
                </ValidatedField>
                <div className="mt-4">
                  {isNew && (
                    <Alert color="info">
                      <small>
                        Note: Your booking request will require administrator approval before it is confirmed. You will receive a
                        confirmation email once approved.
                      </small>
                    </Alert>
                  )}
                </div>
                <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/appointment" replace color="info">
                  <FontAwesomeIcon icon="arrow-left" />
                  &nbsp;
                  <span className="d-none d-md-inline">
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </span>
                </Button>
                &nbsp;
                <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                  <FontAwesomeIcon icon="save" />
                  &nbsp;
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
              </ValidatedForm>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AppointmentUpdate;
