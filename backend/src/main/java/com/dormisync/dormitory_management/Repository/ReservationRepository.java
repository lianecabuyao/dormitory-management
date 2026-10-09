package com.dormisync.dormitory_management.Repository;

import com.dormisync.dormitory_management.Entity.Reservation;
import com.dormisync.dormitory_management.Enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByTenantId(Long tenantId);

    List<Reservation> findByRoomId(Long roomId);

    List<Reservation> findByStatus(ReservationStatus status);
}
