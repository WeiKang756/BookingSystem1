import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col, Badge, Card, CardBody, CardHeader } from 'reactstrap';
import { Translate, TextFormat } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faBan, faFlag, faClock, faUser, faList } from '@fortawesome/free-solid-svg-icons';
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

  // Calculate time remaining until appointment cannot be cancelled
  const getCancellationTimeRemaining = startTime => {
    if (!startTime) return null;

    const appointmentTime = new Date(startTime);
    const now = new Date();
    const cancellationDeadline = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);

    // If past the cancellation deadline, return null
    if (now > cancellationDeadline) return null;

    const timeDiff = cancellationDeadline.getTime() - now.getTime();

    // Convert to days, hours, minutes
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
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

  const cancellationTimeRemaining = getCancellationTimeRemaining(appointmentEntity.startTime);

  return (
    <div>
      <h2 data-cy="appointmentDetailsHeading" className="mb-4">
        <Translate contentKey="simpleBookingSystemApp.appointment.detail.title">Appointment</Translate>
      </h2>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <Row>
        <Col md="8">
          {/* Status Card */}
          <Card className="mb-4 shadow-sm">
            <CardHeader className="bg-light">
              <h4 className="mb-0">
                <Translate contentKey="simpleBookingSystemApp.appointment.status">Status</Translate>
              </h4>
            </CardHeader>
            <CardBody className="d-flex justify-content-between align-items-center">
              <div>{appointmentEntity.status && getStatusBadge(appointmentEntity.status)}</div>
              {appointmentEntity.status === 'REQUESTED' && (
                <div>
                  <small className="text-muted">
                    <FontAwesomeIcon icon={faClock} className="me-1" />
                    <Translate contentKey="simpleBookingSystemApp.appointment.pendingApproval">Pending Admin Approval</Translate>
                  </small>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Appointment Details Card */}
          <Card className="mb-4 shadow-sm">
            <CardHeader className="bg-light">
              <h4 className="mb-0">
                <Translate contentKey="simpleBookingSystemApp.appointment.details">Appointment Details</Translate>
              </h4>
            </CardHeader>
            <CardBody>
              <Row className="mb-2">
                <Col md="4" className="fw-bold">
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  <Translate contentKey="simpleBookingSystemApp.appointment.startTime">Start Time</Translate>
                </Col>
                <Col md="8">
                  {appointmentEntity.startTime ? (
                    <TextFormat value={appointmentEntity.startTime} type="date" format={APP_DATE_FORMAT} />
                  ) : null}
                </Col>
              </Row>
              <Row className="mb-2">
                <Col md="4" className="fw-bold">
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  <Translate contentKey="simpleBookingSystemApp.appointment.endTime">End Time</Translate>
                </Col>
                <Col md="8">
                  {appointmentEntity.endTime ? <TextFormat value={appointmentEntity.endTime} type="date" format={APP_DATE_FORMAT} /> : null}
                </Col>
              </Row>
              <Row className="mb-2">
                <Col md="4" className="fw-bold">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  <Translate contentKey="simpleBookingSystemApp.appointment.user">User</Translate>
                </Col>
                <Col md="8">{appointmentEntity.user ? appointmentEntity.user.login : ''}</Col>
              </Row>
              <Row>
                <Col md="4" className="fw-bold">
                  <FontAwesomeIcon icon={faList} className="me-2" />
                  <Translate contentKey="simpleBookingSystemApp.appointment.service">Service</Translate>
                </Col>
                <Col md="8">{appointmentEntity.service ? appointmentEntity.service.name : ''}</Col>
              </Row>
            </CardBody>
          </Card>

          {/* Cancellation Policy Card */}
          {(appointmentEntity.status === 'SCHEDULED' || appointmentEntity.status === 'REQUESTED') && (
            <Card className="mb-4 shadow-sm">
              <CardHeader className="bg-light">
                <h4 className="mb-0">
                  <Translate contentKey="simpleBookingSystemApp.appointment.cancellationPolicy">Cancellation Policy</Translate>
                </h4>
              </CardHeader>
              <CardBody>
                <p>
                  <Translate contentKey="simpleBookingSystemApp.appointment.cancellationExplanation">
                    Appointments can be cancelled up to 24 hours before the scheduled time.
                  </Translate>
                </p>
                {cancellationTimeRemaining ? (
                  <div className="alert alert-info">
                    <FontAwesomeIcon icon={faClock} className="me-2" />
                    <Translate contentKey="simpleBookingSystemApp.appointment.cancellationTimeRemaining">
                      Time remaining to cancel:
                    </Translate>{' '}
                    {cancellationTimeRemaining.days > 0 && <span>{cancellationTimeRemaining.days} days, </span>}
                    {cancellationTimeRemaining.hours} hours, {cancellationTimeRemaining.minutes} minutes
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <FontAwesomeIcon icon={faBan} className="me-2" />
                    <Translate contentKey="simpleBookingSystemApp.appointment.cancellationNotAllowed">
                      This appointment cannot be cancelled (less than 24 hours remaining).
                    </Translate>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Actions Card */}
          <Card className="shadow-sm">
            <CardHeader className="bg-light">
              <h4 className="mb-0">
                <Translate contentKey="simpleBookingSystemApp.appointment.actions">Actions</Translate>
              </h4>
            </CardHeader>
            <CardBody>
              <div className="d-flex flex-wrap gap-2">
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
                    <Button onClick={handleApprove} color="success">
                      <FontAwesomeIcon icon={faCheck} />{' '}
                      <span className="d-none d-md-inline">
                        <Translate contentKey="entity.action.approve">Approve</Translate>
                      </span>
                    </Button>
                    <Button onClick={handleReject} color="danger">
                      <FontAwesomeIcon icon={faTimes} />{' '}
                      <span className="d-none d-md-inline">
                        <Translate contentKey="entity.action.reject">Reject</Translate>
                      </span>
                    </Button>
                  </>
                )}

                {/* Complete button for scheduled appointments (admin only) */}
                {isAdmin && appointmentEntity.status === 'SCHEDULED' && (
                  <Button onClick={handleComplete} color="info">
                    <FontAwesomeIcon icon={faFlag} />{' '}
                    <span className="d-none d-md-inline">
                      <Translate contentKey="entity.action.complete">Complete</Translate>
                    </span>
                  </Button>
                )}

                {/* Cancel button for appointments that can be cancelled */}
                {(appointmentEntity.status === 'SCHEDULED' || appointmentEntity.status === 'REQUESTED') &&
                  isWithinCancellationWindow(appointmentEntity.startTime) && (
                    <Button onClick={handleCancel} color="warning">
                      <FontAwesomeIcon icon={faBan} />{' '}
                      <span className="d-none d-md-inline">
                        <Translate contentKey="entity.action.cancel">Cancel</Translate>
                      </span>
                    </Button>
                  )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AppointmentDetail;
