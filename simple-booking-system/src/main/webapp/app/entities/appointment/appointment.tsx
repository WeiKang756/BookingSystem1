import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Table, Badge } from 'reactstrap';
import { JhiItemCount, JhiPagination, TextFormat, Translate, getSortState, translate, getPaginationState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortDown, faSortUp, faCheck, faTimes, faBan, faFlag } from '@fortawesome/free-solid-svg-icons';
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
    const appointmentTime = new Date(startTime);
    const now = new Date();
    // Add 24 hours to current time
    const cancellationDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return appointmentTime > cancellationDeadline;
  };

  return (
    <div>
      <h2 id="appointment-heading" data-cy="AppointmentHeading">
        <Translate contentKey="simpleBookingSystemApp.appointment.home.title">Appointments</Translate>
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
      </h2>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="table-responsive">
        {appointmentList && appointmentList.length > 0 ? (
          <Table responsive className="table-striped">
            <thead>
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
                <th />
              </tr>
            </thead>
            <tbody>
              {appointmentList.map((appointment, i) => (
                <tr key={`entity-${i}`} data-cy="entityTable">
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
                  <td className="text-end">
                    <div className="btn-group flex-btn-group-container">
                      <Button tag={Link} to={`/appointment/${appointment.id}`} color="info" size="sm" data-cy="entityDetailsButton">
                        <FontAwesomeIcon icon="eye" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.view">View</Translate>
                        </span>
                      </Button>
                      <Button
                        tag={Link}
                        to={`/appointment/${appointment.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}
                        color="primary"
                        size="sm"
                        data-cy="entityEditButton"
                      >
                        <FontAwesomeIcon icon="pencil-alt" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.edit">Edit</Translate>
                        </span>
                      </Button>

                      {/* Admin Actions for Requested Appointments */}
                      {isAdmin && appointment.status === 'REQUESTED' && (
                        <>
                          <Button onClick={() => handleApprove(appointment.id)} color="success" size="sm" data-cy="entityApproveButton">
                            <FontAwesomeIcon icon={faCheck} />{' '}
                            <span className="d-none d-md-inline">
                              <Translate contentKey="entity.action.approve">Approve</Translate>
                            </span>
                          </Button>
                          <Button onClick={() => handleReject(appointment.id)} color="danger" size="sm" data-cy="entityRejectButton">
                            <FontAwesomeIcon icon={faTimes} />{' '}
                            <span className="d-none d-md-inline">
                              <Translate contentKey="entity.action.reject">Reject</Translate>
                            </span>
                          </Button>
                        </>
                      )}

                      {/* Complete button for scheduled appointments (admin only) */}
                      {isAdmin && appointment.status === 'SCHEDULED' && (
                        <Button onClick={() => handleComplete(appointment.id)} color="info" size="sm" data-cy="entityCompleteButton">
                          <FontAwesomeIcon icon={faFlag} />{' '}
                          <span className="d-none d-md-inline">
                            <Translate contentKey="entity.action.complete">Complete</Translate>
                          </span>
                        </Button>
                      )}

                      {/* Cancel button for appointments that can be cancelled */}
                      {(appointment.status === 'SCHEDULED' || appointment.status === 'REQUESTED') &&
                        isWithinCancellationWindow(appointment.startTime) && (
                          <Button onClick={() => handleCancel(appointment.id)} color="warning" size="sm" data-cy="entityCancelButton">
                            <FontAwesomeIcon icon={faBan} />{' '}
                            <span className="d-none d-md-inline">
                              <Translate contentKey="entity.action.cancel">Cancel</Translate>
                            </span>
                          </Button>
                        )}

                      {/* Delete button only for admins */}
                      {isAdmin && (
                        <Button
                          onClick={() =>
                            (window.location.href = `/appointment/${appointment.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`)
                          }
                          color="danger"
                          size="sm"
                          data-cy="entityDeleteButton"
                        >
                          <FontAwesomeIcon icon="trash" />{' '}
                          <span className="d-none d-md-inline">
                            <Translate contentKey="entity.action.delete">Delete</Translate>
                          </span>
                        </Button>
                      )}
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
      {totalItems ? (
        <div className={appointmentList && appointmentList.length > 0 ? '' : 'd-none'}>
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
