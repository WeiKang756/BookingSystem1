**Title**: Online Appointment Booking

**As a** Customer
**I want** to book appointments online
**So that** I can easily schedule appointments at my convenience without having to call or email.

**Business Logic**:
- Bookings should not overlap.
- A confirmation email should be sent to the customer *only* after admin approval.
- Cancellations should be allowed up to 24 hours before the appointment time.
- Booking requests must be approved by an admin before they are confirmed.

**Acceptance Criteria**:
1. Users can view available time slots for a given service.
2. Users can select a time slot and submit a booking request.
3. Users receive a confirmation email *only* after their booking is approved by an admin.
4. The system prevents double-booking of time slots.
5. The system handles invalid input gracefully.
6. Users can cancel appointments up to 24 hours in advance.

**Functional Requirements**:
- View available time slots.
- Submit a booking request.
- Receive booking confirmation (email).
- Cancel an appointment.
- Manage appointment details (e.g., date, time, service).
- Search for available appointments based on criteria (e.g., date, service).

**Non-Functional Requirements**:
- The system should be user-friendly and easy to navigate.
- The system should be secure and protect user data.
- The system should be performant and respond quickly to user requests.
- The system should be reliable and available 24/7.

**UI Design**:
- A calendar view to display available time slots.
- A clear and concise booking form.
- A confirmation page after successful booking.
- A user account section to manage bookings.
- Responsive design for various screen sizes.
