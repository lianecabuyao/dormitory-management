package com.dormisync.dormitory_management.Repository;

import com.dormisync.dormitory_management.Entity.MaintenanceRequest;
import com.dormisync.dormitory_management.Enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, Long> {
    List<MaintenanceRequest> findByTenantId(Long tenantId);

    List<MaintenanceRequest> findByRoomId(Long roomId);

    List<MaintenanceRequest> findByStatus(MaintenanceStatus status);
}
