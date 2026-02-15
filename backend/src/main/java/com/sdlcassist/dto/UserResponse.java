package com.sdlcassist.dto;

import com.sdlcassist.model.User;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String displayName;
    private String role;
    private String email;
    private Instant createdAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .role(user.getRole().name())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
