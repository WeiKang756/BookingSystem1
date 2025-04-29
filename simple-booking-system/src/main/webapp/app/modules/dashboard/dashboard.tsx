import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, CardBody, CardTitle, Button, Alert } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUserCog, faList, faChartLine, faUsers, faCog } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector, useAppDispatch } from 'app/config/store';
import { getEntities as getAppointments } from 'app/entities/appointment/appointment.reducer';
import { getEntities as getServices } from 'app/entities/service/service.reducer';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';
import './dashboard.scss';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const appointmentList = useAppSelector(state => state.appointment.entities);
  const serviceList = useAppSelector(state => state.service.entities);
  const account = useAppSelector(state => state.authentication.account);
  const isAdmin = hasAnyAuthority(account.authorities, [AUTHORITIES.ADMIN]);

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    dispatch(getAppointments({}));
    dispatch(getServices({}));
  }, []);

  useEffect(() => {
    // Filter appointments - for regular users, show only their appointments
    // For admins, show all appointments or recent ones
    const now = new Date().toISOString();
    const filtered = appointmentList.filter(appointment => {
      if (isAdmin) {
        return appointment.startTime > now;
      } else {
        return appointment.startTime > now && appointment.user.login === account.login;
      }
    });

    // Sort by start time
    filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Take only the first 5
    setUpcomingAppointments(filtered.slice(0, 5));
  }, [appointmentList, account, isAdmin]);

  return (
    <div className="dashboard-container">
      <Row className="mb-4">
        <Col>
          <h2>
            <FontAwesomeIcon icon={isAdmin ? faUserCog : faCalendarAlt} className="me-2" />
            {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
          </h2>
          <p className="text-muted">{isAdmin ? 'Manage your services, appointments, and users.' : 'View and manage your appointments.'}</p>
        </Col>
      </Row>

      {/* Quick Actions Section */}
      <Row className="mb-5">
        <Col md={12}>
          <Card className="shadow-sm">
            <CardBody>
              <CardTitle tag="h5">Quick Actions</CardTitle>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/appointment/new">
                  <Button color="primary">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    New Appointment
                  </Button>
                </Link>

                <Link to="/appointment">
                  <Button color="info">
                    <FontAwesomeIcon icon={faList} className="me-2" />
                    View All Appointments
                  </Button>
                </Link>

                {isAdmin && (
                  <>
                    <Link to="/service">
                      <Button color="success">
                        <FontAwesomeIcon icon={faCog} className="me-2" />
                        Manage Services
                      </Button>
                    </Link>

                    <Link to="/admin/user-management">
                      <Button color="warning">
                        <FontAwesomeIcon icon={faUsers} className="me-2" />
                        User Management
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Upcoming Appointments Section */}
        <Col md={8} className="mb-4">
          <Card className="h-100 shadow-sm">
            <CardBody>
              <CardTitle tag="h5">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                {isAdmin ? 'Recent Appointments' : 'Your Upcoming Appointments'}
              </CardTitle>

              {upcomingAppointments.length > 0 ? (
                <div className="appointments-list">
                  {upcomingAppointments.map(appointment => (
                    <div key={appointment.id} className="appointment-item p-3 mb-2 border rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{appointment.service?.name || 'No Service Selected'}</h6>
                          <p className="text-muted mb-0 small">
                            {new Date(appointment.startTime).toLocaleString()} - {new Date(appointment.endTime).toLocaleTimeString()}
                          </p>
                          {isAdmin && (
                            <p className="text-muted mb-0 small">
                              <strong>Client:</strong> {appointment.user.login}
                            </p>
                          )}
                        </div>
                        <div>
                          <span className={`status-badge status-${appointment.status.toLowerCase()}`}>{appointment.status}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Link to={`/appointment/${appointment.id}`}>
                          <Button size="sm" color="outline-primary">
                            Details
                          </Button>
                        </Link>
                        {appointment.status === 'SCHEDULED' && (
                          <Link to={`/appointment/${appointment.id}/delete`} className="ms-2">
                            <Button size="sm" color="outline-danger">
                              Cancel
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert color="info" className="mt-3">
                  {isAdmin ? 'There are no upcoming appointments.' : 'You have no upcoming appointments. Book one now!'}
                </Alert>
              )}

              <div className="mt-3">
                <Link to="/appointment">
                  <Button color="link" className="ps-0">
                    View All Appointments
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Services or Stats Section */}
        <Col md={4} className="mb-4">
          {isAdmin ? (
            <Card className="h-100 shadow-sm">
              <CardBody>
                <CardTitle tag="h5">
                  <FontAwesomeIcon icon={faChartLine} className="me-2" />
                  System Statistics
                </CardTitle>
                <div className="stats-container">
                  <div className="stat-item mb-3 p-3 border rounded">
                    <h6 className="mb-1">Total Appointments</h6>
                    <p className="mb-0 fs-4">{appointmentList.length}</p>
                  </div>
                  <div className="stat-item mb-3 p-3 border rounded">
                    <h6 className="mb-1">Available Services</h6>
                    <p className="mb-0 fs-4">{serviceList.length}</p>
                  </div>
                  <div className="stat-item mb-3 p-3 border rounded">
                    <h6 className="mb-1">Upcoming Appointments</h6>
                    <p className="mb-0 fs-4">{upcomingAppointments.length}</p>
                  </div>
                </div>
                <Link to="/admin/metrics">
                  <Button color="link" className="ps-0">
                    View System Metrics
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ) : (
            <Card className="h-100 shadow-sm">
              <CardBody>
                <CardTitle tag="h5">
                  <FontAwesomeIcon icon={faCog} className="me-2" />
                  Available Services
                </CardTitle>
                <div className="services-list">
                  {serviceList.length > 0 ? (
                    serviceList.slice(0, 5).map(service => (
                      <div key={service.id} className="service-item p-3 mb-2 border rounded">
                        <h6 className="mb-1">{service.name}</h6>
                        <p className="text-muted mb-1 small">${service.price}</p>
                        <Link to={`/appointment/new?serviceId=${service.id}`}>
                          <Button size="sm" color="outline-primary">
                            Book Now
                          </Button>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <Alert color="info">No services available.</Alert>
                  )}
                </div>
                <Link to="/service">
                  <Button color="link" className="ps-0">
                    View All Services
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
