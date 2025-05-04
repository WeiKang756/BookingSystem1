package com.mycompany.myapp.service;

import com.mycompany.myapp.domain.Appointment;
import com.mycompany.myapp.domain.enumeration.AppointmentStatus;
import com.mycompany.myapp.repository.AppointmentRepository;
import com.mycompany.myapp.service.dto.AppointmentDTO;
import com.mycompany.myapp.service.mapper.AppointmentMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.mycompany.myapp.domain.Appointment}.
 */
@Service
@Transactional
public class AppointmentService {

    private static final Logger LOG = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;

    private final AppointmentMapper appointmentMapper;

    private final MailService mailService;

    private final UserService userService;

    public AppointmentService(
        AppointmentRepository appointmentRepository,
        AppointmentMapper appointmentMapper,
        MailService mailService,
        UserService userService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentMapper = appointmentMapper;
        this.mailService = mailService;
        this.userService = userService;
    }

    /**
     * Save a appointment.
     *
     * @param appointmentDTO the entity to save.
     * @return the persisted entity.
     */
    public AppointmentDTO save(AppointmentDTO appointmentDTO) {
        LOG.debug("Request to save Appointment : {}", appointmentDTO);

        // For new appointments, set status to REQUESTED by default
        if (appointmentDTO.getId() == null && appointmentDTO.getStatus() == null) {
            appointmentDTO.setStatus(AppointmentStatus.REQUESTED);
        }

        Appointment appointment = appointmentMapper.toEntity(appointmentDTO);

        // Check for overlapping appointments
        boolean hasOverlap = checkForOverlappingAppointments(appointment);
        if (hasOverlap) {
            LOG.warn("Attempted to create overlapping appointment: {}", appointmentDTO);
            throw new IllegalStateException("Cannot create appointment - time slot overlaps with an existing appointment");
        }

        appointment = appointmentRepository.save(appointment);
        return appointmentMapper.toDto(appointment);
    }

    /**
     * Update a appointment.
     *
     * @param appointmentDTO the entity to save.
     * @return the persisted entity.
     */
    public AppointmentDTO update(AppointmentDTO appointmentDTO) {
        LOG.debug("Request to update Appointment : {}", appointmentDTO);

        // Get the existing appointment
        Optional<Appointment> existingAppointmentOpt = appointmentRepository.findById(appointmentDTO.getId());

        if (existingAppointmentOpt.isPresent()) {
            Appointment existingAppointment = existingAppointmentOpt.get();

            // Check if trying to cancel an appointment less than 24 hours before it starts
            if (
                existingAppointment.getStatus() != AppointmentStatus.CANCELLED && appointmentDTO.getStatus() == AppointmentStatus.CANCELLED
            ) {
                Instant now = Instant.now();
                Instant appointmentTime = existingAppointment.getStartTime();
                long hoursUntilAppointment = ChronoUnit.HOURS.between(now, appointmentTime);

                if (hoursUntilAppointment < 24) {
                    LOG.warn("Attempted to cancel appointment less than 24 hours before start: {}", appointmentDTO);
                    throw new IllegalStateException("Appointments can only be cancelled at least 24 hours before they start");
                }

                // Send cancellation email
                userService
                    .getUserWithAuthoritiesByLogin(existingAppointment.getUser().getLogin())
                    .ifPresent(user -> mailService.sendAppointmentCancellationEmail(user, appointmentMapper.toDto(existingAppointment)));
            }

            // Check for status modification by non-admin users (handled in resource layer)

            // Check for overlapping appointments if times are changed
            if (
                !existingAppointment.getStartTime().equals(appointmentDTO.getStartTime()) ||
                !existingAppointment.getEndTime().equals(appointmentDTO.getEndTime())
            ) {
                Appointment updatedAppointment = appointmentMapper.toEntity(appointmentDTO);
                boolean hasOverlap = checkForOverlappingAppointments(updatedAppointment);
                if (hasOverlap) {
                    LOG.warn("Attempted to update to overlapping appointment times: {}", appointmentDTO);
                    throw new IllegalStateException("Cannot update appointment - time slot overlaps with an existing appointment");
                }
            }
        }

        Appointment appointment = appointmentMapper.toEntity(appointmentDTO);
        appointment = appointmentRepository.save(appointment);
        return appointmentMapper.toDto(appointment);
    }

    /**
     * Partially update a appointment.
     *
     * @param appointmentDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<AppointmentDTO> partialUpdate(AppointmentDTO appointmentDTO) {
        LOG.debug("Request to partially update Appointment : {}", appointmentDTO);

        return appointmentRepository
            .findById(appointmentDTO.getId())
            .map(existingAppointment -> {
                // Check if trying to cancel an appointment less than 24 hours before it starts
                if (
                    appointmentDTO.getStatus() != null &&
                    existingAppointment.getStatus() != AppointmentStatus.CANCELLED &&
                    appointmentDTO.getStatus() == AppointmentStatus.CANCELLED
                ) {
                    Instant now = Instant.now();
                    Instant appointmentTime = existingAppointment.getStartTime();
                    long hoursUntilAppointment = ChronoUnit.HOURS.between(now, appointmentTime);

                    if (hoursUntilAppointment < 24) {
                        LOG.warn("Attempted to cancel appointment less than 24 hours before start: {}", appointmentDTO);
                        throw new IllegalStateException("Appointments can only be cancelled at least 24 hours before they start");
                    }

                    // If cancellation is valid, send email notification
                    AppointmentDTO dto = appointmentMapper.toDto(existingAppointment);
                    userService
                        .getUserWithAuthoritiesByLogin(existingAppointment.getUser().getLogin())
                        .ifPresent(user -> mailService.sendAppointmentCancellationEmail(user, dto));
                }

                appointmentMapper.partialUpdate(existingAppointment, appointmentDTO);
                return existingAppointment;
            })
            .map(appointmentRepository::save)
            .map(appointmentMapper::toDto);
    }

    /**
     * Get all the appointments.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<AppointmentDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Appointments");
        return appointmentRepository.findAll(pageable).map(appointmentMapper::toDto);
    }

    /**
     * Get all the appointments with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<AppointmentDTO> findAllWithEagerRelationships(Pageable pageable) {
        return appointmentRepository.findAllWithEagerRelationships(pageable).map(appointmentMapper::toDto);
    }

    /**
     * Get one appointment by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<AppointmentDTO> findOne(Long id) {
        LOG.debug("Request to get Appointment : {}", id);
        return appointmentRepository.findOneWithEagerRelationships(id).map(appointmentMapper::toDto);
    }

    /**
     * Delete the appointment by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Appointment : {}", id);

        // Check if appointment is scheduled within 24 hours
        Optional<Appointment> appointmentOpt = appointmentRepository.findById(id);
        if (appointmentOpt.isPresent()) {
            Appointment appointment = appointmentOpt.get();

            Instant now = Instant.now();
            Instant appointmentTime = appointment.getStartTime();
            long hoursUntilAppointment = ChronoUnit.HOURS.between(now, appointmentTime);

            if (hoursUntilAppointment < 24 && appointment.getStatus() == AppointmentStatus.SCHEDULED) {
                LOG.warn("Attempted to delete appointment less than 24 hours before start: {}", id);
                throw new IllegalStateException("Appointments can only be cancelled at least 24 hours before they start");
            }

            // If deletion is valid for a scheduled appointment, send cancellation email
            if (appointment.getStatus() == AppointmentStatus.SCHEDULED) {
                AppointmentDTO dto = appointmentMapper.toDto(appointment);
                userService
                    .getUserWithAuthoritiesByLogin(appointment.getUser().getLogin())
                    .ifPresent(user -> mailService.sendAppointmentCancellationEmail(user, dto));
            }
        }

        appointmentRepository.deleteById(id);
    }

    /**
     * Approve an appointment request.
     *
     * @param id the id of the appointment to approve.
     * @return the persisted entity.
     */
    @Transactional
    public Optional<AppointmentDTO> approveAppointment(Long id) {
        LOG.debug("Request to approve Appointment : {}", id);

        return appointmentRepository
            .findById(id)
            .map(appointment -> {
                LOG.info("Found appointment: {}, current status: {}", id, appointment.getStatus());
                if (appointment.getStatus() == AppointmentStatus.REQUESTED) {
                    LOG.info("Updating appointment status from REQUESTED to SCHEDULED");
                    appointment.setStatus(AppointmentStatus.SCHEDULED);
                    appointmentRepository.save(appointment);

                    // Send confirmation email to the user
                    AppointmentDTO dto = appointmentMapper.toDto(appointment);
                    userService
                        .getUserWithAuthoritiesByLogin(appointment.getUser().getLogin())
                        .ifPresent(user -> mailService.sendAppointmentConfirmationEmail(user, dto));

                    return appointmentMapper.toDto(appointment);
                } else {
                    LOG.warn("Cannot approve appointment with status: {}", appointment.getStatus());
                    return appointmentMapper.toDto(appointment);
                }
            });
    }

    /**
     * Check for overlapping appointments.
     *
     * @param appointment the appointment to check.
     * @return true if there is an overlap, false otherwise.
     */
    private boolean checkForOverlappingAppointments(Appointment appointment) {
        // Find all appointments for the same service with overlapping times
        Instant startTime = appointment.getStartTime();
        Instant endTime = appointment.getEndTime();
        Long appointmentId = appointment.getId();

        // For an existing appointment (update), exclude itself from the check
        if (appointmentId != null) {
            return appointmentRepository.countOverlappingAppointmentsExcludingSelf(startTime, endTime, appointmentId) > 0;
        } else {
            // For a new appointment
            return appointmentRepository.countOverlappingAppointments(startTime, endTime) > 0;
        }
    }
}
