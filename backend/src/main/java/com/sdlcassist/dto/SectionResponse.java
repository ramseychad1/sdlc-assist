package com.sdlcassist.dto;

import com.sdlcassist.model.RequirementSection;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class SectionResponse {
    private UUID id;
    private UUID projectId;
    private String sectionType;
    private String title;
    private String content;
    private Integer sortOrder;
    private Instant createdAt;
    private Instant updatedAt;

    public static SectionResponse from(RequirementSection section) {
        return SectionResponse.builder()
                .id(section.getId())
                .projectId(section.getProject().getId())
                .sectionType(section.getSectionType())
                .title(section.getTitle())
                .content(section.getContent())
                .sortOrder(section.getSortOrder())
                .createdAt(section.getCreatedAt())
                .updatedAt(section.getUpdatedAt())
                .build();
    }
}
