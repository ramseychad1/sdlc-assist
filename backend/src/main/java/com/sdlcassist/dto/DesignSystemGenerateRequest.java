package com.sdlcassist.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class DesignSystemGenerateRequest {
    private JsonNode templateMetadata;
}
