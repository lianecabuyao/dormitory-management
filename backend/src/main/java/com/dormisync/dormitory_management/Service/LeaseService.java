package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.Entity.Lease;
import com.dormisync.dormitory_management.Entity.Reservation;
import com.dormisync.dormitory_management.Entity.Room;
import com.dormisync.dormitory_management.Enums.LeaseStatus;
import com.dormisync.dormitory_management.Enums.ReservationStatus;
import com.dormisync.dormitory_management.Enums.RoomStatus;
import com.dormisync.dormitory_management.Repository.LeaseRepository;
import com.dormisync.dormitory_management.Repository.ReservationRepository;
import com.dormisync.dormitory_management.Repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class LeaseService {
    private final LeaseRepository leaseRepository;
    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;

    public LeaseService(
            LeaseRepository leaseRepository,
            ReservationRepository reservationRepository,
            RoomRepository roomRepository) {

        this.leaseRepository = leaseRepository;
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
    }

    public List<Lease> getAllLeases() {
        return leaseRepository.findAll();
    }

    public Lease getLeaseById(Long id) {
        return leaseRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Lease not found"));
    }

    public Lease createLease(
            Long reservationId,
            LocalDate startDate,
            LocalDate endDate) {

        Reservation reservation =
                reservationRepository.findById(reservationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Reservation not found"
                                ));

        if (reservation.getStatus()
                != ReservationStatus.APPROVED) {

            throw new RuntimeException(
                    "Reservation must be approved first"
            );
        }

        if (leaseRepository.findByReservationId(reservationId)
                .isPresent()) {

            throw new RuntimeException(
                    "Lease already exists for this reservation"
            );
        }

        Lease lease = new Lease();

        lease.setReservation(reservation);
        lease.setTenant(reservation.getTenant());
        lease.setRoom(reservation.getRoom());

        lease.setStartDate(startDate);
        lease.setEndDate(endDate);

        lease.setMonthlyRent(
                reservation.getRoom().getMonthlyRate()
        );

        lease.setStatus(LeaseStatus.PENDING);

        return leaseRepository.save(lease);
    }

    public Lease activateLease(Long id) {

        Lease lease = getLeaseById(id);
        Room room = lease.getRoom();

        if (room.getCurrentOccupants() >= room.getCapacity()) {
            throw new RuntimeException(
                    "Room has reached maximum capacity"
            );
        }

        lease.setStatus(LeaseStatus.ACTIVE);

        room.setCurrentOccupants(
                room.getCurrentOccupants() + 1
        );

        if (room.getCurrentOccupants()
                >= room.getCapacity()) {

            room.setStatus(RoomStatus.OCCUPIED);

        } else {

            room.setStatus(RoomStatus.AVAILABLE);
        }

        roomRepository.save(room);

        return leaseRepository.save(lease);
    }

    public Lease terminateLease(Long id) {

        Lease lease = getLeaseById(id);

        if (lease.getStatus() == LeaseStatus.ACTIVE) {

            Room room = lease.getRoom();

            int occupants =
                    Math.max(0,
                            room.getCurrentOccupants() - 1);

            room.setCurrentOccupants(occupants);

            if (occupants < room.getCapacity()) {
                room.setStatus(RoomStatus.AVAILABLE);
            }

            roomRepository.save(room);
        }

        lease.setStatus(LeaseStatus.TERMINATED);

        return leaseRepository.save(lease);
    }

    public List<Lease> getLeasesByTenant(Long tenantId) {
        return leaseRepository.findByTenantId(tenantId);
    }
}
