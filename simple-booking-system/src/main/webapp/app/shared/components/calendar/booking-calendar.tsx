import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, ButtonGroup, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faClock, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import './booking-calendar.scss';

export interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface CalendarDay {
  date: dayjs.Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isPast: boolean;
  slots: TimeSlot[];
}

interface BookingCalendarProps {
  availableSlots?: TimeSlot[];
  onSelectTimeSlot?: (slot: TimeSlot) => void;
  serviceId?: number;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ availableSlots = [], onSelectTimeSlot, serviceId }) => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate calendar days for the current month view
  useEffect(() => {
    const firstDayOfMonth = currentDate.startOf('month');
    const lastDayOfMonth = currentDate.endOf('month');

    // Start from the first day of the week containing the first day of the month
    const startDate = firstDayOfMonth.day(0); // 0 is Sunday

    // Calculate days needed to show (6 weeks maximum)
    const days: CalendarDay[] = [];
    const today = dayjs();

    for (let i = 0; i < 42; i++) {
      const date = startDate.add(i, 'day');
      const isCurrentMonth = date.month() === currentDate.month();
      const isToday = date.format('YYYY-MM-DD') === today.format('YYYY-MM-DD');
      const isWeekend = date.day() === 0 || date.day() === 6;
      const isPast = date.isBefore(today, 'day');

      // For demo, generate some random slots
      const demoSlots: TimeSlot[] = [];
      if (!isPast && isCurrentMonth) {
        // Create sample slots
        const startHour = 9;
        const slotsPerDay = 8;

        for (let j = 0; j < slotsPerDay; j++) {
          const startTime = date
            .hour(startHour + j)
            .minute(0)
            .second(0);
          const endTime = startTime.add(1, 'hour');

          // Randomly mark some as unavailable
          const isAvailable = Math.random() > 0.3;

          demoSlots.push({
            id: `slot-${date.format('YYYYMMDD')}-${j}`,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAvailable,
          });
        }
      }

      days.push({
        date,
        isCurrentMonth,
        isToday,
        isWeekend,
        isPast,
        slots: demoSlots,
      });
    }

    setCalendarDays(days);
  }, [currentDate]);

  // Handle month navigation
  const goToPreviousMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  // Handle date selection
  const handleDateClick = (day: CalendarDay) => {
    if (!day.isPast) {
      setSelectedDate(day.date);
      setTimeSlots(day.slots);
      setIsModalOpen(true);
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  // Handle booking confirmation
  const handleConfirmBooking = () => {
    if (selectedSlot && onSelectTimeSlot) {
      onSelectTimeSlot(selectedSlot);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="booking-calendar">
      {/* Calendar header */}
      <div className="calendar-header d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">{currentDate.format('MMMM YYYY')}</h3>
        <div className="calendar-nav">
          <ButtonGroup>
            <Button color="light" onClick={goToPreviousMonth}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </Button>
            <Button color="light" onClick={() => setCurrentDate(dayjs())}>
              Today
            </Button>
            <Button color="light" onClick={goToNextMonth}>
              <FontAwesomeIcon icon={faChevronRight} />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {/* Weekday headers */}
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div key={index} className="weekday-header">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="calendar-days">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} 
                         ${day.isToday ? 'today' : ''} 
                         ${day.isWeekend ? 'weekend' : ''} 
                         ${day.isPast ? 'past' : ''}
                         ${day.slots.some(slot => slot.isAvailable) ? 'has-slots' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              <div className="day-number">{day.date.date()}</div>
              {day.slots.some(slot => slot.isAvailable) && !day.isPast && (
                <div className="availability-indicator">
                  <span className="available-slots-count">{day.slots.filter(slot => slot.isAvailable).length} slots</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Time slot selection modal */}
      <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(!isModalOpen)} className="time-slot-modal">
        <ModalHeader toggle={() => setIsModalOpen(false)}>
          <FontAwesomeIcon icon={faCalendarDay} className="me-2" />
          {selectedDate ? selectedDate.format('dddd, MMMM D, YYYY') : 'Select Time Slot'}
        </ModalHeader>
        <ModalBody>
          {timeSlots.length > 0 ? (
            <div className="time-slots-container">
              <Row>
                {timeSlots.map((slot, index) => (
                  <Col md={6} key={slot.id || index} className="mb-3">
                    <Card
                      className={`time-slot-card ${!slot.isAvailable ? 'unavailable' : ''} ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                      onClick={() => slot.isAvailable && handleTimeSlotSelect(slot)}
                    >
                      <CardBody>
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faClock} className="me-2" />
                          <div>
                            <div className="time-range">
                              {dayjs(slot.startTime).format('h:mm A')} - {dayjs(slot.endTime).format('h:mm A')}
                            </div>
                            <div className="slot-status">{slot.isAvailable ? 'Available' : 'Unavailable'}</div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="mb-0">No available time slots for this date.</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          {selectedSlot ? (
            serviceId ? (
              <Link to={`/appointment/new?serviceId=${serviceId}&startTime=${selectedSlot.startTime}&endTime=${selectedSlot.endTime}`}>
                <Button color="primary">Continue to Booking</Button>
              </Link>
            ) : (
              <Button color="primary" onClick={handleConfirmBooking}>
                Select Time Slot
              </Button>
            )
          ) : (
            <Button color="primary" disabled>
              Select Time Slot
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default BookingCalendar;
