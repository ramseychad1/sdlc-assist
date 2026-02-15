package com.sdlcassist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectRequest {
    @NotBlank(message = "Project name is required")
    @Size(max = 255, message = "Project name must be less than 255 characters")
    private String name;

    private String description;
}
