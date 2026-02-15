package com.sdlcassist.dto;

import com.sdlcassist.model.Project;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProjectResponse {
    private UUID id;
    private String name;
    private String description;
    private String prdContent;
    private String status;
    private String ownerName;
    private UUID ownerId;
    private Instant createdAt;
    private Instant updatedAt;

    public static ProjectResponse from(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .prdContent(project.getPrdContent())
                .status(project.getStatus().name())
                .ownerName(project.getOwner() != null ? project.getOwner().getDisplayName() : null)
                .ownerId(project.getOwner() != null ? project.getOwner().getId() : null)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
