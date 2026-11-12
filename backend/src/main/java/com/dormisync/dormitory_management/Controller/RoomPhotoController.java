package com.dormisync.dormitory_management.Controller;

import com.dormisync.dormitory_management.Entity.RoomPhoto;
import com.dormisync.dormitory_management.Service.RoomPhotoService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Room photos. Each change returns the room's updated photo list. */
@RestController
@RequestMapping("/api/rooms/{roomId}/photos")
public class RoomPhotoController {
    private final RoomPhotoService photoService;

    public RoomPhotoController(RoomPhotoService photoService) {
        this.photoService = photoService;
    }

    @GetMapping
    public List<RoomPhoto> getPhotos(@PathVariable Long roomId) {
        return photoService.getPhotos(roomId);
    }

    /** Multipart upload; send one or more files in the "files" field. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<RoomPhoto> upload(
            @PathVariable Long roomId,
            @RequestParam("files") List<MultipartFile> files) {

        return photoService.upload(roomId, files);
    }

    @PutMapping("/{photoId}/cover")
    public List<RoomPhoto> setCover(@PathVariable Long roomId, @PathVariable Long photoId) {
        return photoService.setCover(roomId, photoId);
    }

    @DeleteMapping("/{photoId}")
    public List<RoomPhoto> delete(@PathVariable Long roomId, @PathVariable Long photoId) {
        return photoService.delete(roomId, photoId);
    }
}
