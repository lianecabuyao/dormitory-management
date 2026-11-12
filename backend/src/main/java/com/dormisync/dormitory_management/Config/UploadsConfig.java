package com.dormisync.dormitory_management.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/** Serves uploaded files, e.g. GET /uploads/rooms/abc.jpg -> {app.uploads.dir}/rooms/abc.jpg */
@Configuration
public class UploadsConfig implements WebMvcConfigurer {
    private final String uploadsLocation;

    public UploadsConfig(@Value("${app.uploads.dir:uploads}") String uploadsDir) {
        this.uploadsLocation = Paths.get(uploadsDir).toAbsolutePath().normalize().toUri().toString();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsLocation.endsWith("/") ? uploadsLocation : uploadsLocation + "/");
    }
}
