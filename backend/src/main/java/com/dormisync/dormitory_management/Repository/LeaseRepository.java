package com.dormisync.dormitory_management.Repository;

import com.dormisync.dormitory_management.Entity.Lease;
import com.dormisync.dormitory_management.Enums.LeaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaseRepository extends JpaRepository<Lease, Long> {
    List<Lease> findByTenantId(Long tenantId);

    List<Lease> findByRoomId(Long roomId);

    List<Lease> findByStatus(LeaseStatus status);

    Optional<Lease> findByReservationId(Long reservationId);
}
