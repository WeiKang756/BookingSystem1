package com.mycompany.myapp.repository;

import com.mycompany.myapp.domain.Appointment;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Appointment entity.
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    @Query("select appointment from Appointment appointment where appointment.user.login = ?#{authentication.name}")
    List<Appointment> findByUserIsCurrentUser();

    default Optional<Appointment> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<Appointment> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<Appointment> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select appointment from Appointment appointment left join fetch appointment.user left join fetch appointment.service",
        countQuery = "select count(appointment) from Appointment appointment"
    )
    Page<Appointment> findAllWithToOneRelationships(Pageable pageable);

    @Query("select appointment from Appointment appointment left join fetch appointment.user left join fetch appointment.service")
    List<Appointment> findAllWithToOneRelationships();

    @Query(
        "select appointment from Appointment appointment left join fetch appointment.user left join fetch appointment.service where appointment.id =:id"
    )
    Optional<Appointment> findOneWithToOneRelationships(@Param("id") Long id);

    /**
     * Find appointments that overlap with the specified time range.
     * This helps prevent double bookings.
     *
     * @param startTime the start time of the period
     * @param endTime the end time of the period
     * @param excludeId id of appointment to exclude (useful for updates)
     * @return list of overlapping appointments
     */
    @Query(
        "SELECT a FROM Appointment a WHERE " +
        "((a.startTime <= :endTime AND a.endTime >= :startTime) OR " +
        "(a.startTime >= :startTime AND a.startTime < :endTime)) " +
        "AND a.status != 'CANCELLED' " +
        "AND a.id != :excludeId"
    )
    List<Appointment> findOverlappingAppointments(
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime,
        @Param("excludeId") Long excludeId
    );
}
