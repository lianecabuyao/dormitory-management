package com.dormisync.dormitory_management.Entity;

import com.dormisync.dormitory_management.Enums.RoomStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String roomNumber;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Integer currentOccupants = 0;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomStatus status = RoomStatus.AVAILABLE;

    /** URL of the room's main photo, e.g. /uploads/rooms/abc.jpg. Managed by RoomPhotoService. */
    private String coverPhotoUrl;

    public String getCoverPhotoUrl() {
        return coverPhotoUrl;
    }

    public void setCoverPhotoUrl(String coverPhotoUrl) {
        this.coverPhotoUrl = coverPhotoUrl;
    }

    public Room() {
    }

    public Room(String roomNumber,
                String type,
                Integer capacity,
                BigDecimal monthlyRate) {

        this.roomNumber = roomNumber;
        this.type = type;
        this.capacity = capacity;
        this.monthlyRate = monthlyRate;
        this.currentOccupants = 0;
        this.status = RoomStatus.AVAILABLE;
    }

    public Long getId() {
        return id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Integer getCurrentOccupants() {
        return currentOccupants;
    }

    public void setCurrentOccupants(Integer currentOccupants) {
        this.currentOccupants = currentOccupants;
    }

    public BigDecimal getMonthlyRate() {
        return monthlyRate;
    }

    public void setMonthlyRate(BigDecimal monthlyRate) {
        this.monthlyRate = monthlyRate;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }
}
