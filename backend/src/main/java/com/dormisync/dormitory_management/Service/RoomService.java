package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.Entity.Room;
import com.dormisync.dormitory_management.Enums.RoomStatus;
import com.dormisync.dormitory_management.Repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomService {
    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room getRoomById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Room not found"));
    }

    public Room createRoom(Room room) {

        if (roomRepository.existsByRoomNumber(room.getRoomNumber())) {
            throw new RuntimeException("Room number already exists");
        }

        if (room.getCurrentOccupants() == null) {
            room.setCurrentOccupants(0);
        }

        if (room.getStatus() == null) {
            room.setStatus(RoomStatus.AVAILABLE);
        }

        return roomRepository.save(room);
    }

    public Room updateRoom(Long id, Room updatedRoom) {

        Room room = getRoomById(id);

        room.setRoomNumber(updatedRoom.getRoomNumber());
        room.setType(updatedRoom.getType());
        room.setCapacity(updatedRoom.getCapacity());
        room.setCurrentOccupants(updatedRoom.getCurrentOccupants());
        room.setMonthlyRate(updatedRoom.getMonthlyRate());
        room.setStatus(updatedRoom.getStatus());

        return roomRepository.save(room);
    }

    public void deleteRoom(Long id) {

        Room room = getRoomById(id);

        roomRepository.delete(room);
    }

    public List<Room> getAvailableRooms() {
        return roomRepository.findByStatus(RoomStatus.AVAILABLE);
    }
}
