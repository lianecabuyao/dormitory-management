package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.Entity.Bill;
import com.dormisync.dormitory_management.Entity.Lease;
import com.dormisync.dormitory_management.Entity.Reservation;
import com.dormisync.dormitory_management.Entity.Room;
import com.dormisync.dormitory_management.Enums.BillStatus;
import com.dormisync.dormitory_management.Enums.LeaseStatus;
import com.dormisync.dormitory_management.Enums.ReservationStatus;
import com.dormisync.dormitory_management.Enums.RoomStatus;
import com.dormisync.dormitory_management.Repository.LeaseRepository;
import com.dormisync.dormitory_management.Repository.ReservationRepository;
import com.dormisync.dormitory_management.Repository.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class LeaseService {
    private final LeaseRepository leaseRepository;
    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final BillService billService;

    public LeaseService(
            LeaseRepository leaseRepository,
            ReservationRepository reservationRepository,
            RoomRepository roomRepository,
            BillService billService) {

        this.leaseRepository = leaseRepository;
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.billService = billService;
    }

    public List<Lease> getAllLeases() {
        return leaseRepository.findAll();
    }

    public Lease getLeaseById(Long id) {
        return leaseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lease not found"));
    }

    /** Creates a PENDING lease and its monthly bills. */
    @Transactional
    public Lease createLease(
            Long reservationId,
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate == null || endDate == null) {
            throw badRequest("Start date and end date are required");
        }
        if (!endDate.isAfter(startDate)) {
            throw badRequest("End date must be after the start date");
        }

        Reservation reservation =
                reservationRepository.findById(reservationId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Reservation not found"));

        if (reservation.getStatus() != ReservationStatus.APPROVED) {
            throw badRequest("Reservation must be approved first");
        }

        if (leaseRepository.findByReservationId(reservationId).isPresent()) {
            throw badRequest("Lease already exists for this reservation");
        }

        Lease lease = new Lease();

        lease.setReservation(reservation);
        lease.setTenant(reservation.getTenant());
        lease.setRoom(reservation.getRoom());

        lease.setStartDate(startDate);
        lease.setEndDate(endDate);

        lease.setMonthlyRent(reservation.getRoom().getMonthlyRate());

        lease.setStatus(LeaseStatus.PENDING);

        Lease saved = leaseRepository.save(lease);
        billService.generateBills(saved);
        return saved;
    }

    /** Move-in. Only allowed once the first month's rent is paid and confirmed. */
    @Transactional
    public Lease activateLease(Long id) {

        Lease lease = getLeaseById(id);

        if (lease.getStatus() != LeaseStatus.PENDING) {
            throw badRequest("Only pending leases can be activated");
        }

        List<Bill> bills = billService.billsFor(lease);
        if (bills.get(0).getStatus() != BillStatus.PAID) {
            throw badRequest("The first month's rent must be paid and confirmed before the tenant can move in");
        }

        Room room = lease.getRoom();

        if (room.getCurrentOccupants() >= room.getCapacity()) {
            throw badRequest("Room has reached maximum capacity");
        }

        lease.setStatus(LeaseStatus.ACTIVE);

        room.setCurrentOccupants(room.getCurrentOccupants() + 1);

        if (room.getCurrentOccupants() >= room.getCapacity()) {
            room.setStatus(RoomStatus.OCCUPIED);
        } else {
            room.setStatus(RoomStatus.AVAILABLE);
        }

        roomRepository.save(room);

        return leaseRepository.save(lease);
    }

    /** Move-out (or cancelling a lease before move-in). Months not yet started are cancelled. */
    @Transactional
    public Lease terminateLease(Long id) {

        Lease lease = getLeaseById(id);
        boolean wasActive = lease.getStatus() == LeaseStatus.ACTIVE;

        if (!wasActive && lease.getStatus() != LeaseStatus.PENDING) {
            throw badRequest("This lease has already ended");
        }

        if (wasActive) {

            Room room = lease.getRoom();

            int occupants = Math.max(0, room.getCurrentOccupants() - 1);

            room.setCurrentOccupants(occupants);

            if (occupants < room.getCapacity()) {
                room.setStatus(RoomStatus.AVAILABLE);
            }

            roomRepository.save(room);
        }

        billService.cancelRemainingBills(lease, wasActive);

        lease.setStatus(LeaseStatus.TERMINATED);

        return leaseRepository.save(lease);
    }

    public List<Lease> getLeasesByTenant(Long tenantId) {
        return leaseRepository.findByTenantId(tenantId);
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
