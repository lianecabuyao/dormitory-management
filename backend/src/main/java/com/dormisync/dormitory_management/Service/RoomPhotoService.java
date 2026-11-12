package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.Entity.Room;
import com.dormisync.dormitory_management.Entity.RoomPhoto;
import com.dormisync.dormitory_management.Repository.RoomPhotoRepository;
import com.dormisync.dormitory_management.Repository.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/** Uploading, listing and deleting room photos. Files live in {app.uploads.dir}/rooms/. */
@Service
public class RoomPhotoService {
    private static final Logger log = LoggerFactory.getLogger(RoomPhotoService.class);

    public static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    public static final int MAX_PHOTOS_PER_ROOM = 10;

    private final RoomPhotoRepository photoRepository;
    private final RoomRepository roomRepository;
    private final Path roomsDir;

    public RoomPhotoService(
            RoomPhotoRepository photoRepository,
            RoomRepository roomRepository,
            @Value("${app.uploads.dir:uploads}") String uploadsDir) {

        this.photoRepository = photoRepository;
        this.roomRepository = roomRepository;
        this.roomsDir = Paths.get(uploadsDir).toAbsolutePath().normalize().resolve("rooms");
    }

    public List<RoomPhoto> getPhotos(Long roomId) {
        return photoRepository.findByRoomIdOrderByIdAsc(roomId);
    }

    @Transactional
    public List<RoomPhoto> upload(Long roomId, List<MultipartFile> files) {
        Room room = findRoom(roomId);

        if (files == null || files.isEmpty() || files.stream().allMatch(MultipartFile::isEmpty)) {
            throw badRequest("Choose at least one photo to upload");
        }

        long existing = photoRepository.countByRoomId(roomId);
        if (existing + files.size() > MAX_PHOTOS_PER_ROOM) {
            throw badRequest("A room can have at most " + MAX_PHOTOS_PER_ROOM + " photos ("
                    + existing + " already uploaded)");
        }

        // Check every file before saving any, so a bad file doesn't leave a half-finished upload.
        List<String> extensions = new ArrayList<>();
        for (MultipartFile file : files) {
            extensions.add(validate(file));
        }

        List<Path> written = new ArrayList<>();
        try {
            Files.createDirectories(roomsDir);

            for (int i = 0; i < files.size(); i++) {
                String fileName = UUID.randomUUID() + "." + extensions.get(i);
                Path target = roomsDir.resolve(fileName);

                try (InputStream in = files.get(i).getInputStream()) {
                    Files.copy(in, target);
                }
                written.add(target);

                RoomPhoto photo = new RoomPhoto();
                photo.setRoom(room);
                photo.setFileName(fileName);
                photo.setCover(false);
                photo.setUploadedAt(LocalDateTime.now());
                photoRepository.save(photo);
            }
        } catch (IOException e) {
            written.forEach(this::deleteQuietly);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the photo");
        }

        syncCover(room);
        return getPhotos(roomId);
    }

    @Transactional
    public List<RoomPhoto> setCover(Long roomId, Long photoId) {
        Room room = findRoom(roomId);
        RoomPhoto chosen = findPhoto(roomId, photoId);

        for (RoomPhoto photo : getPhotos(roomId)) {
            photo.setCover(photo.getId().equals(chosen.getId()));
            photoRepository.save(photo);
        }

        syncCover(room);
        return getPhotos(roomId);
    }

    @Transactional
    public List<RoomPhoto> delete(Long roomId, Long photoId) {
        Room room = findRoom(roomId);
        RoomPhoto photo = findPhoto(roomId, photoId);

        photoRepository.delete(photo);
        photoRepository.flush();
        deleteQuietly(roomsDir.resolve(photo.getFileName()));

        syncCover(room);
        return getPhotos(roomId);
    }

    /**
     * Removes the photo records of a room that is being deleted and returns the
     * files to delete once the room deletion has succeeded.
     */
    @Transactional
    public List<Path> removeRecordsForRoom(Long roomId) {
        List<RoomPhoto> photos = getPhotos(roomId);
        photoRepository.deleteAll(photos);
        photoRepository.flush();
        return photos.stream().map(p -> roomsDir.resolve(p.getFileName())).toList();
    }

    public void deleteFiles(List<Path> files) {
        files.forEach(this::deleteQuietly);
    }

    /** Makes sure exactly one photo is the cover and copies its URL onto the room. */
    private void syncCover(Room room) {
        List<RoomPhoto> photos = getPhotos(room.getId());
        RoomPhoto cover = photos.stream().filter(RoomPhoto::isCover).findFirst()
                .orElse(photos.isEmpty() ? null : photos.get(0));

        for (RoomPhoto photo : photos) {
            boolean isCover = photo == cover;
            if (photo.isCover() != isCover) {
                photo.setCover(isCover);
                photoRepository.save(photo);
            }
        }

        room.setCoverPhotoUrl(cover == null ? null : cover.getUrl());
        roomRepository.save(room);
    }

    /** Returns the file extension to use, judged from the file's actual bytes (not its name). */
    private String validate(MultipartFile file) {
        if (file.isEmpty()) {
            throw badRequest("One of the files is empty");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw badRequest("Each photo must be 5 MB or smaller");
        }

        byte[] head = new byte[12];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.readNBytes(head, 0, head.length);
        } catch (IOException e) {
            throw badRequest("Could not read the uploaded file");
        }

        String type = detectImageType(head, read);
        if (type == null) {
            throw badRequest("Only JPG, PNG and WebP images are allowed");
        }
        return type;
    }

    private static String detectImageType(byte[] b, int len) {
        if (len >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (len >= 8 && Arrays.equals(Arrays.copyOf(b, 8),
                new byte[]{(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'})) {
            return "png";
        }
        if (len >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "webp";
        }
        return null;
    }

    private Room findRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
    }

    private RoomPhoto findPhoto(Long roomId, Long photoId) {
        RoomPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found"));
        if (!photo.getRoom().getId().equals(roomId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }
        return photo;
    }

    private void deleteQuietly(Path file) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Could not delete photo file {}", file, e);
        }
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
