package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.Entity.Reservation;
import com.dormisync.dormitory_management.Entity.Room;
import com.dormisync.dormitory_management.Entity.User;
import com.dormisync.dormitory_management.Enums.ReservationStatus;
import com.dormisync.dormitory_management.Enums.RoomStatus;
import com.dormisync.dormitory_management.Enums.UserRole;
import com.dormisync.dormitory_management.Repository.ReservationRepository;
import com.dormisync.dormitory_management.Repository.RoomRepository;
import com.dormisync.dormitory_management.Repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            RoomRepository roomRepository) {

        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    public Reservation getReservationById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Reservation not found"));
    }

    public Reservation createReservation(
            Long tenantId,
            Long roomId) {

        User tenant = userRepository.findById(tenantId)
                .orElseThrow(() ->
                        new RuntimeException("Tenant not found"));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() ->
                        new RuntimeException("Room not found"));

        if (tenant.getRole() != UserRole.TENANT) {
            throw new RuntimeException(
                    "Only tenants can create reservations"
            );
        }

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new RuntimeException(
                    "Room is not available"
            );
        }

        if (room.getCurrentOccupants() >= room.getCapacity()) {
            throw new RuntimeException(
                    "Room is already full"
            );
        }

        Reservation reservation = new Reservation();

        reservation.setTenant(tenant);
        reservation.setRoom(room);
        reservation.setReservationDate(LocalDateTime.now());
        reservation.setStatus(ReservationStatus.PENDING);

        return reservationRepository.save(reservation);
    }

    public Reservation approveReservation(Long id) {

        Reservation reservation = getReservationById(id);

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new RuntimeException(
                    "Only pending reservations can be approved"
            );
        }

        Room room = reservation.getRoom();

        if (room.getCurrentOccupants() >= room.getCapacity()) {
            throw new RuntimeException(
                    "Room is already full"
            );
        }

        reservation.setStatus(ReservationStatus.APPROVED);

        /*
         * For a single-capacity room, reserve it immediately.
         * Shared-room handling can be improved later.
         */
        if (room.getCapacity() == 1) {
            room.setStatus(RoomStatus.RESERVED);
        }

        roomRepository.save(room);

        return reservationRepository.save(reservation);
    }

    public Reservation rejectReservation(Long id) {

        Reservation reservation = getReservationById(id);

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new RuntimeException(
                    "Only pending reservations can be rejected"
            );
        }

        reservation.setStatus(ReservationStatus.REJECTED);

        return reservationRepository.save(reservation);
    }

    public Reservation cancelReservation(Long id) {

        Reservation reservation = getReservationById(id);

        if (reservation.getStatus() == ReservationStatus.APPROVED) {
            Room room = reservation.getRoom();

            if (room.getCurrentOccupants() < room.getCapacity()) {
                room.setStatus(RoomStatus.AVAILABLE);
                roomRepository.save(room);
            }
        }

        reservation.setStatus(ReservationStatus.CANCELLED);

        return reservationRepository.save(reservation);
    }

    public List<Reservation> getReservationsByTenant(Long tenantId) {
        return reservationRepository.findByTenantId(tenantId);
    }

    public List<Reservation> getReservationsByStatus(
            ReservationStatus status) {

        return reservationRepository.findByStatus(status);
    }
}
