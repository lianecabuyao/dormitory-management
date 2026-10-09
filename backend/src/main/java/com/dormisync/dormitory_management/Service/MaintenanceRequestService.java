package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.Entity.MaintenanceRequest;
import com.dormisync.dormitory_management.Entity.Room;
import com.dormisync.dormitory_management.Entity.User;
import com.dormisync.dormitory_management.Enums.MaintenanceStatus;
import com.dormisync.dormitory_management.Enums.UserRole;
import com.dormisync.dormitory_management.Repository.MaintenanceRequestRepository;
import com.dormisync.dormitory_management.Repository.RoomRepository;
import com.dormisync.dormitory_management.Repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MaintenanceRequestService {
    private final MaintenanceRequestRepository maintenanceRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    public MaintenanceRequestService(
            MaintenanceRequestRepository maintenanceRepository,
            UserRepository userRepository,
            RoomRepository roomRepository) {

        this.maintenanceRepository = maintenanceRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
    }

    public List<MaintenanceRequest> getAllRequests() {
        return maintenanceRepository.findAll();
    }

    public MaintenanceRequest getRequestById(Long id) {
        return maintenanceRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Maintenance request not found"
                        ));
    }

    public MaintenanceRequest createRequest(
            Long tenantId,
            Long roomId,
            String title,
            String description) {

        User tenant = userRepository.findById(tenantId)
                .orElseThrow(() ->
                        new RuntimeException("Tenant not found"));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() ->
                        new RuntimeException("Room not found"));

        if (tenant.getRole() != UserRole.TENANT) {
            throw new RuntimeException(
                    "Only tenants can submit maintenance requests"
            );
        }

        MaintenanceRequest request =
                new MaintenanceRequest();

        request.setTenant(tenant);
        request.setRoom(room);
        request.setTitle(title);
        request.setDescription(description);

        request.setCreatedAt(LocalDateTime.now());
        request.setStatus(MaintenanceStatus.PENDING);

        return maintenanceRepository.save(request);
    }

    public MaintenanceRequest startRequest(Long id) {

        MaintenanceRequest request = getRequestById(id);

        request.setStatus(
                MaintenanceStatus.IN_PROGRESS
        );

        return maintenanceRepository.save(request);
    }

    public MaintenanceRequest resolveRequest(Long id) {

        MaintenanceRequest request = getRequestById(id);

        request.setStatus(
                MaintenanceStatus.RESOLVED
        );

        request.setResolvedAt(LocalDateTime.now());

        return maintenanceRepository.save(request);
    }

    public MaintenanceRequest cancelRequest(Long id) {

        MaintenanceRequest request = getRequestById(id);

        request.setStatus(
                MaintenanceStatus.CANCELLED
        );

        return maintenanceRepository.save(request);
    }

    public List<MaintenanceRequest>
    getRequestsByTenant(Long tenantId) {

        return maintenanceRepository
                .findByTenantId(tenantId);
    }

    public List<MaintenanceRequest>
    getRequestsByStatus(MaintenanceStatus status) {

        return maintenanceRepository
                .findByStatus(status);
    }
}
