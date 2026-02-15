package com.sdlcassist.dto;

import com.sdlcassist.model.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotBlank
    private String displayName;

    @NotNull
    private User.Role role;

    @jakarta.validation.constraints.Email
    private String email;
}
