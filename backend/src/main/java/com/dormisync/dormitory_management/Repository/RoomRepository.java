package com.dormisync.dormitory_management.Repository;

import com.dormisync.dormitory_management.Entity.Room;
import com.dormisync.dormitory_management.Enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNumber(String roomNumber);

    boolean existsByRoomNumber(String roomNumber);

    List<Room> findByStatus(RoomStatus status);
}
