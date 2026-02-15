package com.sdlcassist.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private UUID id;
    private String username;
    private String displayName;
    private String role;
}
