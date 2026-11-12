package com.dormisync.dormitory_management.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/** A photo of a room. The image file itself is stored on disk in the uploads folder. */
@Entity
@Table(name = "room_photos")
public class RoomPhoto {
    public static final String URL_PREFIX = "/uploads/rooms/";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    @JsonIgnore
    private Room room;

    /** Server-generated file name, e.g. 3f2a...e1.jpg. Never the uploader's original name. */
    @Column(nullable = false, unique = true)
    private String fileName;

    /** The room's main photo, shown on the room card. */
    @Column(nullable = false)
    private boolean cover;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    public RoomPhoto() {
    }

    /** Sent to the frontend as "url". */
    public String getUrl() {
        return URL_PREFIX + fileName;
    }

    public Long getId() {
        return id;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    @JsonIgnore
    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public boolean isCover() {
        return cover;
    }

    public void setCover(boolean cover) {
        this.cover = cover;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
