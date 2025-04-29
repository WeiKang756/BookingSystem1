import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, CardBody, CardTitle, Button, Alert, Form, FormGroup, Label, Input, Spinner } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getServices } from 'app/entities/service/service.reducer';
import { createEntity as createAppointment } from 'app/entities/appointment/appointment.reducer';
import BookingCalendar, { TimeSlot } from 'app/shared/components/calendar/booking-calendar';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { AppointmentStatus } from 'app/shared/model/enumerations/appointment-status.model';
import './booking-page.scss';

const BookingPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const serviceList = useAppSelector(state => state.service.entities);
  const account = useAppSelector(state => state.authentication.account);
  const creating = useAppSelector(state => state.appointment.updating);
  const updateSuccess = useAppSelector(state => state.appointment.updateSuccess);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [notes, setNotes] = useState('');

  // Load services and check for URL parameters
  useEffect(() => {
    dispatch(getServices({}));

    // Check if we have query parameters for service or time slot
    const serviceId = searchParams.get('serviceId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (serviceId) {
      setSelectedService(parseInt(serviceId, 10));
    }

    if (startTime && endTime) {
      setSelectedTimeSlot({
        startTime,
        endTime,
        isAvailable: true,
      });
      setActiveStep(2);
    }
  }, []);

  // Handle successful appointment creation
  useEffect(() => {
    if (updateSuccess) {
      toast.success('Appointment booked successfully!');
      navigate('/appointment');
    }
  }, [updateSuccess]);

  // Handle service selection
  const handleServiceChange = e => {
    setSelectedService(parseInt(e.target.value, 10));
    setSelectedTimeSlot(null);
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setActiveStep(2);
  };

  // Handle booking confirmation
  const handleBooking = () => {
    if (selectedService && selectedTimeSlot) {
      const newAppointment = {
        startTime: dayjs(selectedTimeSlot.startTime),
        endTime: dayjs(selectedTimeSlot.endTime),
        status: AppointmentStatus.SCHEDULED,
        user: {
          login: account.login,
          id: account.id,
        },
        service: {
          id: selectedService,
        },
      };

      dispatch(createAppointment(newAppointment));
    }
  };

  // Get the selected service object
  const getSelectedServiceObject = () => {
    return serviceList.find(service => service.id === selectedService);
  };

  // Render steps based on active step
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="service-selection mb-4">
              <FormGroup>
                <Label for="service">Select a Service</Label>
                <Input type="select" id="service" name="service" value={selectedService || ''} onChange={handleServiceChange}>
                  <option value="">-- Select a Service --</option>
                  {serviceList.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} (${service.price})
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </div>

            {selectedService ? (
              <div className="calendar-container">
                <h4 className="mb-3">Select a Date and Time</h4>
                <BookingCalendar serviceId={selectedService} onSelectTimeSlot={handleTimeSlotSelect} />
              </div>
            ) : (
              <Alert color="info">Please select a service to view available time slots.</Alert>
            )}
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="booking-summary">
              <h4 className="mb-3">Booking Summary</h4>
              <Card className="mb-4">
                <CardBody>
                  <Row>
                    <Col md={6}>
                      <h5>Service</h5>
                      <p className="mb-3">{getSelectedServiceObject()?.name}</p>

                      <h5>Price</h5>
                      <p className="mb-3">${getSelectedServiceObject()?.price}</p>

                      <h5>Description</h5>
                      <p className="mb-3">{getSelectedServiceObject()?.description || 'No description available.'}</p>
                    </Col>

                    <Col md={6}>
                      <h5>Date & Time</h5>
                      <p className="mb-3">
                        {selectedTimeSlot ? (
                          <>
                            <div>{new Date(selectedTimeSlot.startTime).toLocaleDateString()}</div>
                            <div>
                              {new Date(selectedTimeSlot.startTime).toLocaleTimeString()} -
                              {new Date(selectedTimeSlot.endTime).toLocaleTimeString()}
                            </div>
                          </>
                        ) : (
                          'No time slot selected'
                        )}
                      </p>

                      <h5>Client</h5>
                      <p className="mb-3">{account.login}</p>
                    </Col>
                  </Row>

                  <FormGroup>
                    <Label for="notes">Additional Notes (optional)</Label>
                    <Input type="textarea" id="notes" name="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                  </FormGroup>
                </CardBody>
              </Card>

              <Alert color="warning">
                <strong>Cancellation Policy:</strong> Appointments may be cancelled up to 24 hours before the scheduled time. Cancellations
                made with less than 24 hours notice will not be processed.
              </Alert>

              <div className="d-flex justify-content-between mt-4">
                <Button color="secondary" onClick={() => setActiveStep(1)}>
                  <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                  Back
                </Button>

                <Button color="primary" onClick={handleBooking} disabled={creating}>
                  {creating ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="me-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="booking-page">
      <Row className="mb-4">
        <Col>
          <h2>
            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
            Book an Appointment
          </h2>
          <p className="text-muted">Select a service and time slot to book your appointment.</p>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card className="shadow-sm">
            <CardBody>
              <div className="booking-steps mb-4">
                <div className={`booking-step ${activeStep === 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}>
                  <div className="step-number">1</div>
                  <div className="step-label">Select Service & Time</div>
                </div>

                <div className="step-connector"></div>

                <div className={`booking-step ${activeStep === 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <div className="step-label">Confirm Booking</div>
                </div>
              </div>

              {renderStepContent()}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BookingPage;
