import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Table, Badge, Card, CardBody, Row, Col, UncontrolledTooltip, Alert } from 'reactstrap';
import { JhiItemCount, JhiPagination, TextFormat, Translate, getSortState, translate, getPaginationState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSort,
  faSortDown,
  faSortUp,
  faCheck,
  faTimes,
  faBan,
  faFlag,
  faEye,
  faPencilAlt,
  faTrash,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { APP_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';

import { getEntities, approveAppointment, rejectAppointment, cancelAppointment, completeAppointment } from './appointment.reducer';

export const Appointment = () => {
  const dispatch = useAppDispatch();
  const [errorMessage, setErrorMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const pageLocation = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getPaginationState(pageLocation, ITEMS_PER_PAGE, 'id'), pageLocation.search),
  );

  const appointmentList = useAppSelector(state => state.appointment.entities);
  const loading = useAppSelector(state => state.appointment.loading);
  const totalItems = useAppSelector(state => state.appointment.totalItems);

  const getAllEntities = () => {
    dispatch(
      getEntities({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }),
    );
  };

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (pageLocation.search !== endURL) {
      navigate(`${pageLocation.pathname}${endURL}`);
    }
  };

  const account = useAppSelector(state => state.authentication.account);
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);

  useEffect(() => {
    const params = new URLSearchParams(pageLocation.search);
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [pageLocation.search]);

  const sort = p => () => {
    setPaginationState({
      ...paginationState,
      order: paginationState.order === ASC ? DESC : ASC,
      sort: p,
    });
  };

  const handlePagination = currentPage =>
    setPaginationState({
      ...paginationState,
      activePage: currentPage,
    });

  const handleSyncList = () => {
    sortEntities();
  };

  const getSortIconByFieldName = (fieldName: string) => {
    const sortFieldName = paginationState.sort;
    const order = paginationState.order;
    if (sortFieldName !== fieldName) {
      return faSort;
    }
    return order === ASC ? faSortUp : faSortDown;
  };

  const isAdmin = hasAnyAuthority([AUTHORITIES.ADMIN], account.authorities);

  const handleApprove = (id: string) => {
    setErrorMessage('');
    // Use window.location to navigate to the test endpoint directly
    // This will cause a page reload, but it will work around the API issue
    window.location.href = `/api/appointments/${id}/approve-test`;
    // After a short delay, navigate back to appointments
    setTimeout(() => {
      window.location.href = '/appointment';
    }, 2000);
  };

  const handleReject = (id: string) => {
    setErrorMessage('');
    window.location.href = `/api/appointments/${id}/reject-test`;
    setTimeout(() => {
      window.location.href = '/appointment';
    }, 2000);
  };

  const handleCancel = (id: string) => {
    setErrorMessage('');
    dispatch(cancelAppointment(id))
      .unwrap()
      .then(() => {
        handleSyncList();
      })
      .catch(error => {
        setErrorMessage(error.message || 'An error occurred while canceling the appointment');
      });
  };

  const handleComplete = (id: string) => {
    setErrorMessage('');
    window.location.href = `/api/appointments/${id}/complete-test`;
    setTimeout(() => {
      window.location.href = '/appointment';
    }, 2000);
  };

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
      <Badge color={color} pill>
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

  // Filter appointments by status
  const filteredAppointments = filterStatus ? appointmentList.filter(appointment => appointment.status === filterStatus) : appointmentList;

  return (
    <div>
      <h2 id="appointment-heading" data-cy="AppointmentHeading" className="mb-4">
        <Translate contentKey="simpleBookingSystemApp.appointment.home.title">Appointments</Translate>
      </h2>

      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-end">
            <Button className="me-2" color="info" onClick={handleSyncList} disabled={loading}>
              <FontAwesomeIcon icon="sync" spin={loading} />{' '}
              <Translate contentKey="simpleBookingSystemApp.appointment.home.refreshListLabel">Refresh List</Translate>
            </Button>
            <Link to="/appointment/new" className="btn btn-primary jh-create-entity" id="jh-create-entity" data-cy="entityCreateButton">
              <FontAwesomeIcon icon="plus" />
              &nbsp;
              <Translate contentKey="simpleBookingSystemApp.appointment.home.createLabel">Create new Appointment</Translate>
            </Link>
          </div>
        </Col>
      </Row>

      {/* Status Filter */}
      <Card className="mb-4 shadow-sm">
        <CardBody>
          <div className="d-flex flex-wrap align-items-center">
            <span className="me-3">
              <FontAwesomeIcon icon={faFilter} className="me-1" />
              <Translate contentKey="simpleBookingSystemApp.appointment.filter">Filter by Status</Translate>:
            </span>
            <div className="d-flex flex-wrap gap-2">
              <Button
                color={filterStatus === '' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setFilterStatus('')}
                className="me-2"
              >
                <Translate contentKey="simpleBookingSystemApp.appointment.filterAll">All</Translate>
              </Button>
              <Button
                color={filterStatus === 'REQUESTED' ? 'warning' : 'outline-warning'}
                size="sm"
                onClick={() => setFilterStatus('REQUESTED')}
                className="me-2"
              >
                <Translate contentKey="simpleBookingSystemApp.AppointmentStatus.REQUESTED">Requested</Translate>
              </Button>
              <Button
                color={filterStatus === 'SCHEDULED' ? 'success' : 'outline-success'}
                size="sm"
                onClick={() => setFilterStatus('SCHEDULED')}
                className="me-2"
              >
                <Translate contentKey="simpleBookingSystemApp.AppointmentStatus.SCHEDULED">Scheduled</Translate>
              </Button>
              <Button
                color={filterStatus === 'COMPLETED' ? 'info' : 'outline-info'}
                size="sm"
                onClick={() => setFilterStatus('COMPLETED')}
                className="me-2"
              >
                <Translate contentKey="simpleBookingSystemApp.AppointmentStatus.COMPLETED">Completed</Translate>
              </Button>
              <Button
                color={filterStatus === 'CANCELLED' ? 'danger' : 'outline-danger'}
                size="sm"
                onClick={() => setFilterStatus('CANCELLED')}
                className="me-2"
              >
                <Translate contentKey="simpleBookingSystemApp.AppointmentStatus.CANCELLED">Cancelled</Translate>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {errorMessage && (
        <Alert color="danger" className="mb-4" role="alert">
          {errorMessage}
        </Alert>
      )}

      {isAdmin && (
        <div className="mb-4">
          <Alert color="info">
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon="info-circle" className="me-2" />
              <span>
                <Translate contentKey="simpleBookingSystemApp.appointment.adminInstruction">
                  As an administrator, you can approve, reject, or complete appointments.
                </Translate>
              </span>
            </div>
          </Alert>
        </div>
      )}

      <div className="table-responsive">
        {filteredAppointments && filteredAppointments.length > 0 ? (
          <Table responsive className="table-striped shadow-sm">
            <thead className="bg-light">
              <tr>
                <th className="hand" onClick={sort('id')}>
                  <Translate contentKey="simpleBookingSystemApp.appointment.id">ID</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('id')} />
                </th>
                <th className="hand" onClick={sort('startTime')}>
                  <Translate contentKey="simpleBookingSystemApp.appointment.startTime">Start Time</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('startTime')} />
                </th>
                <th className="hand" onClick={sort('endTime')}>
                  <Translate contentKey="simpleBookingSystemApp.appointment.endTime">End Time</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('endTime')} />
                </th>
                <th className="hand" onClick={sort('status')}>
                  <Translate contentKey="simpleBookingSystemApp.appointment.status">Status</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('status')} />
                </th>
                <th>
                  <Translate contentKey="simpleBookingSystemApp.appointment.user">User</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th>
                  <Translate contentKey="simpleBookingSystemApp.appointment.service">Service</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment, i) => (
                <tr key={`entity-${i}`} data-cy="entityTable" className={appointment.status === 'REQUESTED' ? 'table-warning' : ''}>
                  <td>
                    <Button tag={Link} to={`/appointment/${appointment.id}`} color="link" size="sm">
                      {appointment.id}
                    </Button>
                  </td>
                  <td>
                    {appointment.startTime ? <TextFormat type="date" value={appointment.startTime} format={APP_DATE_FORMAT} /> : null}
                  </td>
                  <td>{appointment.endTime ? <TextFormat type="date" value={appointment.endTime} format={APP_DATE_FORMAT} /> : null}</td>
                  <td>{getStatusBadge(appointment.status)}</td>
                  <td>{appointment.user ? appointment.user.login : ''}</td>
                  <td>{appointment.service ? <Link to={`/service/${appointment.service.id}`}>{appointment.service.name}</Link> : ''}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button tag={Link} to={`/appointment/${appointment.id}`} color="info" size="sm" id={`view-${appointment.id}`}>
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                      <UncontrolledTooltip target={`view-${appointment.id}`}>
                        <Translate contentKey="entity.action.view">View</Translate>
                      </UncontrolledTooltip>

                      {/* Admin Actions for Requested Appointments */}
                      {isAdmin && appointment.status === 'REQUESTED' && (
                        <>
                          <Button color="success" size="sm" onClick={() => handleApprove(appointment.id)} id={`approve-${appointment.id}`}>
                            <FontAwesomeIcon icon={faCheck} />
                          </Button>
                          <UncontrolledTooltip target={`approve-${appointment.id}`}>
                            <Translate contentKey="entity.action.approve">Approve</Translate>
                          </UncontrolledTooltip>

                          <Button color="danger" size="sm" onClick={() => handleReject(appointment.id)} id={`reject-${appointment.id}`}>
                            <FontAwesomeIcon icon={faTimes} />
                          </Button>
                          <UncontrolledTooltip target={`reject-${appointment.id}`}>
                            <Translate contentKey="entity.action.reject">Reject</Translate>
                          </UncontrolledTooltip>
                        </>
                      )}

                      {/* Complete button for scheduled appointments (admin only) */}
                      {isAdmin && appointment.status === 'SCHEDULED' && (
                        <>
                          <Button color="info" size="sm" onClick={() => handleComplete(appointment.id)} id={`complete-${appointment.id}`}>
                            <FontAwesomeIcon icon={faFlag} />
                          </Button>
                          <UncontrolledTooltip target={`complete-${appointment.id}`}>
                            <Translate contentKey="entity.action.complete">Complete</Translate>
                          </UncontrolledTooltip>
                        </>
                      )}

                      {/* Cancel button for appointments that can be cancelled */}
                      {(appointment.status === 'SCHEDULED' || appointment.status === 'REQUESTED') &&
                        isWithinCancellationWindow(appointment.startTime) && (
                          <>
                            <Button color="warning" size="sm" onClick={() => handleCancel(appointment.id)} id={`cancel-${appointment.id}`}>
                              <FontAwesomeIcon icon={faBan} />
                            </Button>
                            <UncontrolledTooltip target={`cancel-${appointment.id}`}>
                              <Translate contentKey="entity.action.cancel">Cancel</Translate>
                            </UncontrolledTooltip>
                          </>
                        )}

                      <Button tag={Link} to={`/appointment/${appointment.id}/edit`} color="primary" size="sm" id={`edit-${appointment.id}`}>
                        <FontAwesomeIcon icon={faPencilAlt} />
                      </Button>
                      <UncontrolledTooltip target={`edit-${appointment.id}`}>
                        <Translate contentKey="entity.action.edit">Edit</Translate>
                      </UncontrolledTooltip>

                      <Button
                        tag={Link}
                        to={`/appointment/${appointment.id}/delete`}
                        color="danger"
                        size="sm"
                        id={`delete-${appointment.id}`}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                      <UncontrolledTooltip target={`delete-${appointment.id}`}>
                        <Translate contentKey="entity.action.delete">Delete</Translate>
                      </UncontrolledTooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          !loading && (
            <div className="alert alert-warning">
              <Translate contentKey="simpleBookingSystemApp.appointment.home.notFound">No Appointments found</Translate>
            </div>
          )
        )}
      </div>
      {filteredAppointments?.length > 0 && totalItems ? (
        <div className={appointmentList?.length > 0 ? '' : 'd-none'}>
          <div className="justify-content-center d-flex">
            <JhiItemCount page={paginationState.activePage} total={totalItems} itemsPerPage={paginationState.itemsPerPage} i18nEnabled />
          </div>
          <div className="justify-content-center d-flex">
            <JhiPagination
              activePage={paginationState.activePage}
              onSelect={handlePagination}
              maxButtons={5}
              itemsPerPage={paginationState.itemsPerPage}
              totalItems={totalItems}
            />
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default Appointment;
