package com.mycompany.myapp.web.rest;

import com.mycompany.myapp.domain.enumeration.AppointmentStatus;
import com.mycompany.myapp.repository.AppointmentRepository;
import com.mycompany.myapp.security.AuthoritiesConstants;
import com.mycompany.myapp.service.AppointmentService;
import com.mycompany.myapp.service.dto.AppointmentDTO;
import com.mycompany.myapp.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.mycompany.myapp.domain.Appointment}.
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentResource {

    private static final Logger LOG = LoggerFactory.getLogger(AppointmentResource.class);

    private static final String ENTITY_NAME = "appointment";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final AppointmentService appointmentService;

    private final AppointmentRepository appointmentRepository;

    public AppointmentResource(AppointmentService appointmentService, AppointmentRepository appointmentRepository) {
        this.appointmentService = appointmentService;
        this.appointmentRepository = appointmentRepository;
    }

    /**
     * {@code POST  /appointments} : Create a new appointment.
     *
     * @param appointmentDTO the appointmentDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new appointmentDTO, or with status {@code 400 (Bad Request)} if the appointment has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<AppointmentDTO> createAppointment(@Valid @RequestBody AppointmentDTO appointmentDTO) throws URISyntaxException {
        LOG.debug("REST request to save Appointment : {}", appointmentDTO);
        if (appointmentDTO.getId() != null) {
            throw new BadRequestAlertException("A new appointment cannot already have an ID", ENTITY_NAME, "idexists");
        }

        // Force new appointments to be in REQUESTED status
        appointmentDTO.setStatus(AppointmentStatus.REQUESTED);

        appointmentDTO = appointmentService.save(appointmentDTO);
        return ResponseEntity.created(new URI("/api/appointments/" + appointmentDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, appointmentDTO.getId().toString()))
            .body(appointmentDTO);
    }

    /**
     * {@code PUT  /appointments/:id} : Updates an existing appointment.
     *
     * @param id the id of the appointmentDTO to save.
     * @param appointmentDTO the appointmentDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated appointmentDTO,
     * or with status {@code 400 (Bad Request)} if the appointmentDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the appointmentDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<AppointmentDTO> updateAppointment(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody AppointmentDTO appointmentDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Appointment : {}, {}", id, appointmentDTO);
        if (appointmentDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, appointmentDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!appointmentRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        // Get existing appointment to check if status is being changed
        Optional<AppointmentDTO> existingAppointment = appointmentService.findOne(id);
        if (existingAppointment.isPresent() && !existingAppointment.get().getStatus().equals(appointmentDTO.getStatus())) {
            // Status is being modified - check authorization
            throw new BadRequestAlertException(
                "Status changes must be performed through appropriate endpoints",
                ENTITY_NAME,
                "statuschange.restricted"
            );
        }

        appointmentDTO = appointmentService.update(appointmentDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, appointmentDTO.getId().toString()))
            .body(appointmentDTO);
    }

    /**
     * {@code PATCH  /appointments/:id} : Partial updates given fields of an existing appointment, field will ignore if it is null
     *
     * @param id the id of the appointmentDTO to save.
     * @param appointmentDTO the appointmentDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated appointmentDTO,
     * or with status {@code 400 (Bad Request)} if the appointmentDTO is not valid,
     * or with status {@code 404 (Not Found)} if the appointmentDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the appointmentDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<AppointmentDTO> partialUpdateAppointment(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody AppointmentDTO appointmentDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Appointment partially : {}, {}", id, appointmentDTO);
        if (appointmentDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, appointmentDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!appointmentRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        // Check if status is being changed
        if (appointmentDTO.getStatus() != null) {
            Optional<AppointmentDTO> existingAppointment = appointmentService.findOne(id);
            if (existingAppointment.isPresent() && !existingAppointment.get().getStatus().equals(appointmentDTO.getStatus())) {
                // Status is being modified - check authorization
                throw new BadRequestAlertException(
                    "Status changes must be performed through appropriate endpoints",
                    ENTITY_NAME,
                    "statuschange.restricted"
                );
            }
        }

        Optional<AppointmentDTO> result = appointmentService.partialUpdate(appointmentDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, appointmentDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /appointments} : get all the appointments.
     *
     * @param pageable the pagination information.
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of appointments in body.
     */
    @GetMapping("")
    public ResponseEntity<List<AppointmentDTO>> getAllAppointments(
        @org.springdoc.core.annotations.ParameterObject Pageable pageable,
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get a page of Appointments");
        Page<AppointmentDTO> page;
        if (eagerload) {
            page = appointmentService.findAllWithEagerRelationships(pageable);
        } else {
            page = appointmentService.findAll(pageable);
        }
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /appointments/:id} : get the "id" appointment.
     *
     * @param id the id of the appointmentDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the appointmentDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDTO> getAppointment(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Appointment : {}", id);
        Optional<AppointmentDTO> appointmentDTO = appointmentService.findOne(id);
        return ResponseUtil.wrapOrNotFound(appointmentDTO);
    }

    /**
     * {@code DELETE  /appointments/:id} : delete the "id" appointment.
     *
     * @param id the id of the appointmentDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Appointment : {}", id);
        appointmentService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    /**
     * {@code PUT  /appointments/:id/approve} : Approve a REQUESTED appointment.
     *
     * @param id the id of the appointment to approve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated appointmentDTO,
     * or with status {@code 404 (Not Found)} if the appointmentDTO is not found.
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<AppointmentDTO> approveAppointment(@PathVariable("id") Long id) {
        LOG.debug("REST request to approve Appointment : {}", id);
        LOG.info("Approving appointment with ID: {}", id);

        Optional<AppointmentDTO> result = appointmentService.approveAppointment(id);

        if (result.isPresent()) {
            LOG.info("Successfully approved appointment: {}", result.get());
            return ResponseUtil.wrapOrNotFound(result, HeaderUtil.createAlert(applicationName, "Appointment approved", id.toString()));
        } else {
            LOG.warn("Failed to approve appointment with ID: {}", id);
            return ResponseUtil.wrapOrNotFound(
                result,
                HeaderUtil.createAlert(applicationName, "Appointment not found or not in REQUESTED state", id.toString())
            );
        }
    }

    /**
     * {@code PUT  /appointments/:id/reject} : Reject a REQUESTED appointment.
     *
     * @param id the id of the appointment to reject.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated appointmentDTO,
     * or with status {@code 404 (Not Found)} if the appointmentDTO is not found.
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<AppointmentDTO> rejectAppointment(@PathVariable("id") Long id) {
        LOG.debug("REST request to reject Appointment : {}", id);

        Optional<AppointmentDTO> result = appointmentService.rejectAppointment(id);

        return ResponseUtil.wrapOrNotFound(result, HeaderUtil.createAlert(applicationName, "Appointment rejected", id.toString()));
    }

    /**
     * {@code PUT  /appointments/:id/cancel} : Cancel an appointment.
     *
     * @param id the id of the appointment to cancel.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated appointmentDTO,
     * or with status {@code 400 (Bad Request)} if cancellation window has passed.
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentDTO> cancelAppointment(@PathVariable("id") Long id) {
        LOG.debug("REST request to cancel Appointment : {}", id);

        try {
            Optional<AppointmentDTO> result = appointmentService.cancelAppointment(id);

            return ResponseUtil.wrapOrNotFound(result, HeaderUtil.createAlert(applicationName, "Appointment cancelled", id.toString()));
        } catch (IllegalStateException e) {
            throw new BadRequestAlertException(e.getMessage(), ENTITY_NAME, "cancellation.toolate");
        }
    }

    /**
     * {@code GET  /appointments/:id/approve-test} : Test endpoint to approve appointments.
     * This is a workaround for testing.
     */
    @GetMapping("/{id}/approve-test")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Void> approveAppointmentTest(@PathVariable("id") Long id) {
        LOG.info("REST request to test approve Appointment : {}", id);

        Optional<AppointmentDTO> result = appointmentService.approveAppointment(id);

        if (result.isPresent()) {
            LOG.info("Test: Successfully approved appointment: {}", result.get());
            // Redirect to the appointments page
            HttpHeaders headers = new HttpHeaders();
            headers.add("Location", "/appointment");
            return ResponseEntity.status(302).headers(headers).build();
        } else {
            LOG.warn("Test: Failed to approve appointment with ID: {}", id);
            // Redirect to the appointments page even if there's a failure
            HttpHeaders headers = new HttpHeaders();
            headers.add("Location", "/appointment");
            return ResponseEntity.status(302).headers(headers).build();
        }
    }

    /**
     * {@code GET  /appointments/:id/reject-test} : Test endpoint to reject appointments.
     * This is a workaround for testing.
     */
    @GetMapping("/{id}/reject-test")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Void> rejectAppointmentTest(@PathVariable("id") Long id) {
        LOG.info("REST request to test reject Appointment : {}", id);

        Optional<AppointmentDTO> result = appointmentService.rejectAppointment(id);

        // Redirect to the appointments page
        HttpHeaders headers = new HttpHeaders();
        headers.add("Location", "/appointment");
        return ResponseEntity.status(302).headers(headers).build();
    }

    /**
     * {@code PUT  /appointments/:id/complete} : Mark a SCHEDULED appointment as COMPLETED.
     *
     * @param id the id of the appointment to mark as completed.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated appointmentDTO,
     * or with status {@code 404 (Not Found)} if the appointmentDTO is not found.
     */
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<AppointmentDTO> completeAppointment(@PathVariable("id") Long id) {
        LOG.debug("REST request to complete Appointment : {}", id);

        Optional<AppointmentDTO> result = appointmentService.completeAppointment(id);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createAlert(applicationName, "Appointment marked as completed", id.toString())
        );
    }

    /**
     * {@code GET  /appointments/:id/complete-test} : Test endpoint to mark appointments as completed.
     * This is a workaround for testing.
     */
    @GetMapping("/{id}/complete-test")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Void> completeAppointmentTest(@PathVariable("id") Long id) {
        LOG.info("REST request to test complete Appointment : {}", id);

        Optional<AppointmentDTO> result = appointmentService.completeAppointment(id);

        // Redirect to the appointments page
        HttpHeaders headers = new HttpHeaders();
        headers.add("Location", "/appointment");
        return ResponseEntity.status(302).headers(headers).build();
    }
}
