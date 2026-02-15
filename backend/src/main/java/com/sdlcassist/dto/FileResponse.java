package com.sdlcassist.dto;

import com.sdlcassist.model.ProjectFile;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FileResponse {
    private UUID id;
    private UUID projectId;
    private String originalFilename;
    private String mimeType;
    private Long fileSize;
    private Instant createdAt;

    public static FileResponse from(ProjectFile file) {
        return FileResponse.builder()
                .id(file.getId())
                .projectId(file.getProject().getId())
                .originalFilename(file.getOriginalFilename())
                .mimeType(file.getMimeType())
                .fileSize(file.getFileSize())
                .createdAt(file.getCreatedAt())
                .build();
    }
}
