package com.dormisync.dormitory_management.Controller;

import com.dormisync.dormitory_management.DTO.ReservationRequest;
import com.dormisync.dormitory_management.Entity.Reservation;
import com.dormisync.dormitory_management.Enums.ReservationStatus;
import com.dormisync.dormitory_management.Service.ReservationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final ReservationService reservationService;

    public ReservationController(
            ReservationService reservationService) {

        this.reservationService = reservationService;
    }

    @GetMapping
    public List<Reservation> getAllReservations() {
        return reservationService.getAllReservations();
    }

    @GetMapping("/{id}")
    public Reservation getReservationById(
            @PathVariable Long id) {

        return reservationService.getReservationById(id);
    }

    @PostMapping
    public Reservation createReservation(
            @RequestBody ReservationRequest request) {

        return reservationService.createReservation(
                request.getTenantId(),
                request.getRoomId()
        );
    }

    @PutMapping("/{id}/approve")
    public Reservation approveReservation(
            @PathVariable Long id) {

        return reservationService.approveReservation(id);
    }

    @PutMapping("/{id}/reject")
    public Reservation rejectReservation(
            @PathVariable Long id) {

        return reservationService.rejectReservation(id);
    }

    @PutMapping("/{id}/cancel")
    public Reservation cancelReservation(
            @PathVariable Long id) {

        return reservationService.cancelReservation(id);
    }

    @GetMapping("/tenant/{tenantId}")
    public List<Reservation> getByTenant(
            @PathVariable Long tenantId) {

        return reservationService
                .getReservationsByTenant(tenantId);
    }

    @GetMapping("/status/{status}")
    public List<Reservation> getByStatus(
            @PathVariable ReservationStatus status) {

        return reservationService
                .getReservationsByStatus(status);
    }
}
