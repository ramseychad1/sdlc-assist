package com.sdlcassist.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SectionRequest {
    @NotBlank(message = "Content is required")
    private String content;
}
