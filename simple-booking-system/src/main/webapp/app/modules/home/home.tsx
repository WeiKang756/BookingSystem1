import './home.scss';

import React from 'react';
import { Link } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { Alert, Col, Row, Button, Card, CardBody, CardTitle, CardText, Container } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClipboardList, faUserClock, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

import { useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';

export const Home = () => {
  const account = useAppSelector(state => state.authentication.account);

  return (
    <div className="booking-system-home">
      {/* Hero Section */}
      <div className="hero-section text-center">
        <h1 className="display-3 fw-bold mb-4">Simple Online Booking System</h1>
        <p className="lead mb-5">Easily schedule and manage your appointments with our user-friendly booking platform</p>

        {!account?.login ? (
          <div className="d-flex justify-content-center gap-3 mb-5">
            <Link to="/login">
              <Button color="primary" size="lg">
                Sign In
              </Button>
            </Link>
            <Link to="/account/register">
              <Button color="outline-primary" size="lg">
                Register
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mb-5">
            <Alert color="success">
              <span className="fw-semibold">Welcome back, {account.login}!</span>{' '}
              {account.authorities?.includes('ROLE_ADMIN') ? (
                <span>You have administrator access to manage the system.</span>
              ) : (
                <span>You can now book and manage your appointments.</span>
              )}
            </Alert>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/appointment">
                <Button color="primary" size="lg">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  View Appointments
                </Button>
              </Link>
              <Link to="/appointment/new">
                <Button color="success" size="lg">
                  <FontAwesomeIcon icon={faUserClock} className="me-2" />
                  Book New Appointment
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Features Section */}
      <Container className="my-5">
        <h2 className="text-center mb-5">Our Booking System Features</h2>
        <Row>
          <Col md={3} className="mb-4">
            <Card className="h-100 shadow-sm feature-card">
              <CardBody className="text-center">
                <FontAwesomeIcon icon={faCalendarAlt} size="3x" className="mb-3 text-primary" />
                <CardTitle tag="h4">Easy Scheduling</CardTitle>
                <CardText>View available time slots and book appointments with just a few clicks.</CardText>
              </CardBody>
            </Card>
          </Col>
          <Col md={3} className="mb-4">
            <Card className="h-100 shadow-sm feature-card">
              <CardBody className="text-center">
                <FontAwesomeIcon icon={faUserClock} size="3x" className="mb-3 text-primary" />
                <CardTitle tag="h4">Real-time Availability</CardTitle>
                <CardText>Check real-time availability and select the most convenient time for you.</CardText>
              </CardBody>
            </Card>
          </Col>
          <Col md={3} className="mb-4">
            <Card className="h-100 shadow-sm feature-card">
              <CardBody className="text-center">
                <FontAwesomeIcon icon={faCheckCircle} size="3x" className="mb-3 text-primary" />
                <CardTitle tag="h4">Instant Confirmation</CardTitle>
                <CardText>Receive instant confirmation emails once your appointment is booked.</CardText>
              </CardBody>
            </Card>
          </Col>
          <Col md={3} className="mb-4">
            <Card className="h-100 shadow-sm feature-card">
              <CardBody className="text-center">
                <FontAwesomeIcon icon={faClipboardList} size="3x" className="mb-3 text-primary" />
                <CardTitle tag="h4">Easy Management</CardTitle>
                <CardText>Manage your appointments - reschedule or cancel when needed.</CardText>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* How It Works */}
      <div className="bg-light py-5 my-5">
        <Container>
          <h2 className="text-center mb-5">How It Works</h2>
          <Row className="text-center">
            <Col md={4} className="mb-4">
              <div className="step-circle mb-3">1</div>
              <h4>Select a Service</h4>
              <p>Browse through our services and select the one you need.</p>
            </Col>
            <Col md={4} className="mb-4">
              <div className="step-circle mb-3">2</div>
              <h4>Choose a Time Slot</h4>
              <p>Select from available time slots that work best for your schedule.</p>
            </Col>
            <Col md={4} className="mb-4">
              <div className="step-circle mb-3">3</div>
              <h4>Confirm Your Booking</h4>
              <p>Receive confirmation instantly and get ready for your appointment.</p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Call to Action */}
      <Container className="text-center my-5">
        <h2 className="mb-4">Ready to Get Started?</h2>
        <p className="lead mb-4">Join our platform today and experience hassle-free booking.</p>
        {!account?.login ? (
          <div className="d-flex justify-content-center gap-3">
            <Link to="/login">
              <Button color="primary" size="lg">
                Sign In
              </Button>
            </Link>
            <Link to="/account/register">
              <Button color="outline-primary" size="lg">
                Register
              </Button>
            </Link>
          </div>
        ) : (
          <Link to="/appointment/new">
            <Button color="primary" size="lg">
              Book Now
            </Button>
          </Link>
        )}
      </Container>
    </div>
  );
};

export default Home;
