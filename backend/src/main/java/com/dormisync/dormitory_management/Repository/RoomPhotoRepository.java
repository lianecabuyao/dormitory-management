package com.dormisync.dormitory_management.Repository;

import com.dormisync.dormitory_management.Entity.RoomPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomPhotoRepository extends JpaRepository<RoomPhoto, Long> {
    List<RoomPhoto> findByRoomIdOrderByIdAsc(Long roomId);

    long countByRoomId(Long roomId);
}
