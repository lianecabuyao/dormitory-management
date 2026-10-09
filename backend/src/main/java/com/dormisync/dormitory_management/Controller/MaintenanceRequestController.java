package com.dormisync.dormitory_management.Controller;

import com.dormisync.dormitory_management.DTO.MaintenanceRequestDTO;
import com.dormisync.dormitory_management.Entity.MaintenanceRequest;
import com.dormisync.dormitory_management.Enums.MaintenanceStatus;
import com.dormisync.dormitory_management.Service.MaintenanceRequestService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceRequestController {
    private final MaintenanceRequestService maintenanceService;

    public MaintenanceRequestController(
            MaintenanceRequestService maintenanceService) {

        this.maintenanceService = maintenanceService;
    }

    @GetMapping
    public List<MaintenanceRequest> getAllRequests() {
        return maintenanceService.getAllRequests();
    }

    @GetMapping("/{id}")
    public MaintenanceRequest getRequestById(
            @PathVariable Long id) {

        return maintenanceService.getRequestById(id);
    }

    @PostMapping
    public MaintenanceRequest createRequest(
            @RequestBody MaintenanceRequestDTO request) {

        return maintenanceService.createRequest(
                request.getTenantId(),
                request.getRoomId(),
                request.getTitle(),
                request.getDescription()
        );
    }

    @PutMapping("/{id}/start")
    public MaintenanceRequest startRequest(
            @PathVariable Long id) {

        return maintenanceService.startRequest(id);
    }

    @PutMapping("/{id}/resolve")
    public MaintenanceRequest resolveRequest(
            @PathVariable Long id) {

        return maintenanceService.resolveRequest(id);
    }

    @PutMapping("/{id}/cancel")
    public MaintenanceRequest cancelRequest(
            @PathVariable Long id) {

        return maintenanceService.cancelRequest(id);
    }

    @GetMapping("/tenant/{tenantId}")
    public List<MaintenanceRequest> getByTenant(
            @PathVariable Long tenantId) {

        return maintenanceService
                .getRequestsByTenant(tenantId);
    }

    @GetMapping("/status/{status}")
    public List<MaintenanceRequest> getByStatus(
            @PathVariable MaintenanceStatus status) {

        return maintenanceService
                .getRequestsByStatus(status);
    }
}
