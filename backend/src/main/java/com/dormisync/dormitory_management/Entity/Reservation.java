package com.dormisync.dormitory_management.Entity;

import com.dormisync.dormitory_management.Enums.ReservationStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private LocalDateTime reservationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status;

    private String remarks;

    public Reservation() {
    }

    public Reservation(User tenant, Room room) {
        this.tenant = tenant;
        this.room = room;
        this.reservationDate = LocalDateTime.now();
        this.status = ReservationStatus.PENDING;
    }

    @PrePersist
    public void prePersist() {

        if (reservationDate == null) {
            reservationDate = LocalDateTime.now();
        }

        if (status == null) {
            status = ReservationStatus.PENDING;
        }
    }

    public Long getId() {
        return id;
    }

    public User getTenant() {
        return tenant;
    }

    public void setTenant(User tenant) {
        this.tenant = tenant;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public LocalDateTime getReservationDate() {
        return reservationDate;
    }

    public void setReservationDate(LocalDateTime reservationDate) {
        this.reservationDate = reservationDate;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
