package com.dormisync.dormitory_management.Controller;

import com.dormisync.dormitory_management.DTO.LeaseRequest;
import com.dormisync.dormitory_management.Entity.Lease;
import com.dormisync.dormitory_management.Service.LeaseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lease")
public class LeaseController {
    private final LeaseService leaseService;

    public LeaseController(LeaseService leaseService) {
        this.leaseService = leaseService;
    }

    @GetMapping
    public List<Lease> getAllLeases() {
        return leaseService.getAllLeases();
    }

    @GetMapping("/{id}")
    public Lease getLeaseById(@PathVariable Long id) {
        return leaseService.getLeaseById(id);
    }

    @PostMapping
    public Lease createLease(
            @RequestBody LeaseRequest request) {

        return leaseService.createLease(
                request.getReservationId(),
                request.getStartDate(),
                request.getEndDate()
        );
    }

    @PutMapping("/{id}/activate")
    public Lease activateLease(@PathVariable Long id) {
        return leaseService.activateLease(id);
    }

    @PutMapping("/{id}/terminate")
    public Lease terminateLease(@PathVariable Long id) {
        return leaseService.terminateLease(id);
    }

    @GetMapping("/tenant/{tenantId}")
    public List<Lease> getLeasesByTenant(
            @PathVariable Long tenantId) {

        return leaseService.getLeasesByTenant(tenantId);
    }
}
