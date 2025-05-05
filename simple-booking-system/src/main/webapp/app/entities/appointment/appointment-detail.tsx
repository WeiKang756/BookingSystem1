import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col, Badge } from 'reactstrap';
import { Translate, TextFormat } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faBan, faFlag } from '@fortawesome/free-solid-svg-icons';
import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';

import { getEntity, approveAppointment, rejectAppointment, cancelAppointment, completeAppointment } from './appointment.reducer';

export const AppointmentDetail = () => {
  const dispatch = useAppDispatch();
  const [errorMessage, setErrorMessage] = useState('');

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const appointmentEntity = useAppSelector(state => state.appointment.entity);
  const account = useAppSelector(state => state.authentication.account);
  const isAdmin = hasAnyAuthority([AUTHORITIES.ADMIN], account.authorities);

  // Return status badge with appropriate color
  const getStatusBadge = status => {
    let color;
    switch (status) {
      case 'REQUESTED':
        color = 'warning';
        break;
      case 'SCHEDULED':
        color = 'success';
        break;
      case 'COMPLETED':
        color = 'info';
        break;
      case 'CANCELLED':
        color = 'danger';
        break;
      default:
        color = 'secondary';
    }
    return (
      <Badge color={color} pill className="fs-6 px-3 py-2">
        <Translate contentKey={`simpleBookingSystemApp.AppointmentStatus.${status}`} />
      </Badge>
    );
  };

  // Check if the appointment is within the cancellation window (24 hours)
  const isWithinCancellationWindow = startTime => {
    if (!startTime) return false;
    const appointmentTime = new Date(startTime);
    const now = new Date();
    // Add 24 hours to current time
    const cancellationDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return appointmentTime > cancellationDeadline;
  };

  const handleApprove = () => {
    setErrorMessage('');
    // Use window.location for direct navigation with page reload
    window.location.href = `/api/appointments/${id}/approve-test`;
    setTimeout(() => {
      window.location.href = `/appointment/${id}`;
    }, 2000);
  };

  const handleReject = () => {
    setErrorMessage('');
    window.location.href = `/api/appointments/${id}/reject-test`;
    setTimeout(() => {
      window.location.href = `/appointment/${id}`;
    }, 2000);
  };

  const handleCancel = () => {
    setErrorMessage('');
    dispatch(cancelAppointment(id))
      .unwrap()
      .then(() => {
        dispatch(getEntity(id));
      })
      .catch(error => {
        setErrorMessage(error.message || 'An error occurred while canceling the appointment');
      });
  };

  const handleComplete = () => {
    setErrorMessage('');
    window.location.href = `/api/appointments/${id}/complete-test`;
    setTimeout(() => {
      window.location.href = `/appointment/${id}`;
    }, 2000);
  };

  return (
    <div>
      <h2 data-cy="appointmentDetailsHeading">
        <Translate contentKey="simpleBookingSystemApp.appointment.detail.title">Appointment</Translate>
      </h2>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="mb-4">{appointmentEntity.status && getStatusBadge(appointmentEntity.status)}</div>

      <Row>
        <Col md="8">
          <dl className="jh-entity-details">
            <dt>
              <span id="id">
                <Translate contentKey="global.field.id">ID</Translate>
              </span>
            </dt>
            <dd>{appointmentEntity.id}</dd>
            <dt>
              <span id="startTime">
                <Translate contentKey="simpleBookingSystemApp.appointment.startTime">Start Time</Translate>
              </span>
            </dt>
            <dd>
              {appointmentEntity.startTime ? <TextFormat value={appointmentEntity.startTime} type="date" format={APP_DATE_FORMAT} /> : null}
            </dd>
            <dt>
              <span id="endTime">
                <Translate contentKey="simpleBookingSystemApp.appointment.endTime">End Time</Translate>
              </span>
            </dt>
            <dd>
              {appointmentEntity.endTime ? <TextFormat value={appointmentEntity.endTime} type="date" format={APP_DATE_FORMAT} /> : null}
            </dd>
            <dt>
              <Translate contentKey="simpleBookingSystemApp.appointment.user">User</Translate>
            </dt>
            <dd>{appointmentEntity.user ? appointmentEntity.user.login : ''}</dd>
            <dt>
              <Translate contentKey="simpleBookingSystemApp.appointment.service">Service</Translate>
            </dt>
            <dd>{appointmentEntity.service ? appointmentEntity.service.name : ''}</dd>
          </dl>

          <div className="mt-4">
            <Button tag={Link} to="/appointment" replace color="info" data-cy="entityDetailsBackButton">
              <FontAwesomeIcon icon="arrow-left" />{' '}
              <span className="d-none d-md-inline">
                <Translate contentKey="entity.action.back">Back</Translate>
              </span>
            </Button>

            <Button tag={Link} to={`/appointment/${appointmentEntity.id}/edit`} replace color="primary">
              <FontAwesomeIcon icon="pencil-alt" />{' '}
              <span className="d-none d-md-inline">
                <Translate contentKey="entity.action.edit">Edit</Translate>
              </span>
            </Button>

            {/* Admin Actions for Requested Appointments */}
            {isAdmin && appointmentEntity.status === 'REQUESTED' && (
              <>
                <Button onClick={handleApprove} color="success" className="ms-2">
                  <FontAwesomeIcon icon={faCheck} />{' '}
                  <span className="d-none d-md-inline">
                    <Translate contentKey="entity.action.approve">Approve</Translate>
                  </span>
                </Button>
                <Button onClick={handleReject} color="danger" className="ms-2">
                  <FontAwesomeIcon icon={faTimes} />{' '}
                  <span className="d-none d-md-inline">
                    <Translate contentKey="entity.action.reject">Reject</Translate>
                  </span>
                </Button>
              </>
            )}

            {/* Complete button for scheduled appointments (admin only) */}
            {isAdmin && appointmentEntity.status === 'SCHEDULED' && (
              <Button onClick={handleComplete} color="info" className="ms-2">
                <FontAwesomeIcon icon={faFlag} />{' '}
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.complete">Complete</Translate>
                </span>
              </Button>
            )}

            {/* Cancel button for appointments that can be cancelled */}
            {(appointmentEntity.status === 'SCHEDULED' || appointmentEntity.status === 'REQUESTED') &&
              isWithinCancellationWindow(appointmentEntity.startTime) && (
                <Button onClick={handleCancel} color="warning" className="ms-2">
                  <FontAwesomeIcon icon={faBan} />{' '}
                  <span className="d-none d-md-inline">
                    <Translate contentKey="entity.action.cancel">Cancel</Translate>
                  </span>
                </Button>
              )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AppointmentDetail;
