package com.sdlcassist.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiAnalysisResponse {
    private String content;
}
