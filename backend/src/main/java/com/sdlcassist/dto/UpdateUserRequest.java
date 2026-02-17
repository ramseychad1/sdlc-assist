package com.sdlcassist.dto;

import com.sdlcassist.model.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @NotBlank(message = "Display name is required")
    private String displayName;

    @NotNull(message = "Role is required")
    private User.Role role;

    // Optional - only update password if provided
    private String password;
}
