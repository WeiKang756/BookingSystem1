package com.mycompany.myapp.service;

import com.mycompany.myapp.domain.Appointment;
import com.mycompany.myapp.domain.enumeration.AppointmentStatus;
import com.mycompany.myapp.repository.AppointmentRepository;
import com.mycompany.myapp.repository.UserRepository;
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

    private final UserRepository userRepository;

    private final MailService mailService;

    public AppointmentService(
        AppointmentRepository appointmentRepository,
        AppointmentMapper appointmentMapper,
        UserRepository userRepository,
        MailService mailService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentMapper = appointmentMapper;
        this.userRepository = userRepository;
        this.mailService = mailService;
    }

    /**
     * Save a appointment.
     *
     * @param appointmentDTO the entity to save.
     * @return the persisted entity.
     */
    public AppointmentDTO save(AppointmentDTO appointmentDTO) {
        LOG.debug("Request to save Appointment : {}", appointmentDTO);

        // If this is a new appointment, set status to REQUESTED
        if (appointmentDTO.getId() == null) {
            appointmentDTO.setStatus(AppointmentStatus.REQUESTED);
        }

        // Check for double booking
        if (appointmentDTO.getStartTime() != null && appointmentDTO.getEndTime() != null) {
            checkForOverlappingAppointments(appointmentDTO);
        }

        Appointment appointment = appointmentMapper.toEntity(appointmentDTO);
        appointment = appointmentRepository.save(appointment);
        return appointmentMapper.toDto(appointment);
    }

    /**
     * Check if there are overlapping appointments.
     *
     * @param appointmentDTO the appointment to check
     * @throws IllegalStateException if there are overlapping appointments
     */
    private void checkForOverlappingAppointments(AppointmentDTO appointmentDTO) {
        Long appointmentId = appointmentDTO.getId();
        Instant startTime = appointmentDTO.getStartTime();
        Instant endTime = appointmentDTO.getEndTime();

        if (startTime != null && endTime != null) {
            // Find any appointment that overlaps with the time period
            boolean hasOverlap =
                appointmentRepository.findOverlappingAppointments(startTime, endTime, appointmentId != null ? appointmentId : -1L).size() >
                0;

            if (hasOverlap) {
                throw new IllegalStateException("Time slot already booked. Please select another time.");
            }
        }
    }

    /**
     * Update a appointment.
     *
     * @param appointmentDTO the entity to save.
     * @return the persisted entity.
     */
    public AppointmentDTO update(AppointmentDTO appointmentDTO) {
        LOG.debug("Request to update Appointment : {}", appointmentDTO);

        // Check for overlapping appointments
        if (appointmentDTO.getStartTime() != null && appointmentDTO.getEndTime() != null) {
            checkForOverlappingAppointments(appointmentDTO);
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

                    // Send confirmation email after approval
                    AppointmentDTO approvedDto = appointmentMapper.toDto(appointment);
                    userRepository
                        .findById(appointment.getUser().getId())
                        .ifPresent(user -> mailService.sendAppointmentConfirmationEmail(user, approvedDto));

                    return approvedDto;
                } else {
                    LOG.warn("Cannot approve appointment with status: {}", appointment.getStatus());
                    return appointmentMapper.toDto(appointment);
                }
            });
    }

    /**
     * Reject an appointment request.
     *
     * @param id the id of the appointment to reject.
     * @return the persisted entity.
     */
    @Transactional
    public Optional<AppointmentDTO> rejectAppointment(Long id) {
        LOG.debug("Request to reject Appointment : {}", id);

        return appointmentRepository
            .findById(id)
            .map(appointment -> {
                if (appointment.getStatus() == AppointmentStatus.REQUESTED) {
                    appointment.setStatus(AppointmentStatus.CANCELLED);
                    appointmentRepository.save(appointment);

                    // Send cancellation email
                    AppointmentDTO rejectedDto = appointmentMapper.toDto(appointment);
                    userRepository
                        .findById(appointment.getUser().getId())
                        .ifPresent(user -> mailService.sendAppointmentCancellationEmail(user, rejectedDto));

                    return rejectedDto;
                } else {
                    LOG.warn("Cannot reject appointment with status: {}", appointment.getStatus());
                    return appointmentMapper.toDto(appointment);
                }
            });
    }

    /**
     * Cancel an appointment.
     *
     * @param id the id of the appointment to cancel.
     * @return the persisted entity.
     * @throws IllegalStateException if cancellation is attempted within 24 hours of the appointment
     */
    @Transactional
    public Optional<AppointmentDTO> cancelAppointment(Long id) {
        LOG.debug("Request to cancel Appointment : {}", id);

        return appointmentRepository
            .findById(id)
            .map(appointment -> {
                // Check if it's not too late to cancel (24 hour policy)
                Instant now = Instant.now();
                Instant appointmentTime = appointment.getStartTime();

                if (appointmentTime != null && now.plus(24, ChronoUnit.HOURS).isAfter(appointmentTime)) {
                    throw new IllegalStateException("Cannot cancel appointments less than 24 hours before the scheduled time");
                }

                if (appointment.getStatus() == AppointmentStatus.SCHEDULED || appointment.getStatus() == AppointmentStatus.REQUESTED) {
                    appointment.setStatus(AppointmentStatus.CANCELLED);
                    appointmentRepository.save(appointment);

                    // Send cancellation email
                    AppointmentDTO cancelledDto = appointmentMapper.toDto(appointment);
                    userRepository
                        .findById(appointment.getUser().getId())
                        .ifPresent(user -> mailService.sendAppointmentCancellationEmail(user, cancelledDto));

                    return cancelledDto;
                } else {
                    LOG.warn("Cannot cancel appointment with status: {}", appointment.getStatus());
                    return appointmentMapper.toDto(appointment);
                }
            });
    }

    /**
     * Mark an appointment as completed.
     *
     * @param id the id of the appointment to mark as completed.
     * @return the persisted entity.
     */
    @Transactional
    public Optional<AppointmentDTO> completeAppointment(Long id) {
        LOG.debug("Request to complete Appointment : {}", id);

        return appointmentRepository
            .findById(id)
            .map(appointment -> {
                if (appointment.getStatus() == AppointmentStatus.SCHEDULED) {
                    appointment.setStatus(AppointmentStatus.COMPLETED);
                    appointmentRepository.save(appointment);
                    return appointmentMapper.toDto(appointment);
                } else {
                    LOG.warn("Cannot mark as completed an appointment with status: {}", appointment.getStatus());
                    return appointmentMapper.toDto(appointment);
                }
            });
    }
}
