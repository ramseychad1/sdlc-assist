package com.sdlcassist.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenDefinitionDto {

    private String id;
    private String projectId;
    private String name;
    private String description;
    private String screenType;
    private String epicName;
    private String complexity;
    private String userRole;
    private String notes;
    private String prototypeContent;
    private Integer displayOrder;
    private Instant createdAt;
}
