**Title**: Online Appointment Booking with Admin Approval and Special Needs

**As a** Customer
**I want** to book appointments online and specify any special needs
**So that** I can easily schedule appointments at my convenience and ensure my needs are accommodated.

**Business Logic**:

- Bookings should not overlap.
- A confirmation email should be sent to the customer only after admin approval.
- Cancellations should be allowed up to 24 hours before the appointment time.
- Booking requests must be approved by an admin before they are confirmed.
- Only admins can modify the booking status.
- Customers can provide details about special needs during booking.

**Acceptance Criteria**:

1. Users can view available time slots for a given service.
2. Users can select a time slot and submit a booking request.
3. Users can specify special needs when booking an appointment.
4. Users receive a confirmation email only after their booking is approved by an admin.
5. The system prevents double-booking of time slots.
6. The system handles invalid input gracefully.
7. Users can cancel appointments up to 24 hours in advance.
8. Only admins can modify a booking's status (e.g., approve, reject, cancel).
9. Admins can view the special needs specified by the customer.

**Functional Requirements**:

- View available time slots.
- Submit a booking request.
- Specify special needs during booking.
- Receive booking confirmation (email).
- Cancel an appointment.
- Manage appointment details (e.g., date, time, service).
- Search for available appointments based on criteria (e.g., date, service).
- (Admin) Approve/Reject booking requests.
- (Admin) View special needs associated with a booking.

**Non-Functional Requirements**:

- The system should be user-friendly and easy to navigate.
- The system should be secure and protect user data.
- The system should be performant and respond quickly to user requests.
- The system should be reliable and available 24/7.

**UI Design**:

- A calendar view to display available time slots.
- A clear and concise booking form.
- A field within the booking form for specifying special needs.
- A confirmation page after successful booking.
- A user account section to manage bookings.
- Responsive design for various screen sizes.
- (Admin) An admin panel for managing booking requests.
- (Admin) Display of special needs within the booking details in the admin panel.
- Distinct card sections for different information groups within the appointment details component.
