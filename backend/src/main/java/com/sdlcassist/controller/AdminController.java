package com.sdlcassist.controller;

import com.sdlcassist.dto.CreateUserRequest;
import com.sdlcassist.dto.ResetPasswordRequest;
import com.sdlcassist.dto.UserResponse;
import com.sdlcassist.model.User;
import com.sdlcassist.service.EmailService;
import com.sdlcassist.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final EmailService emailService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> listUsers() {
        List<UserResponse> users = userService.findAll().stream()
                .map(UserResponse::from)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        if (userService.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        User user = userService.createUser(
                request.getUsername(),
                request.getPassword(),
                request.getDisplayName(),
                request.getRole(),
                request.getEmail()
        );

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            emailService.sendInviteEmail(
                    request.getEmail(),
                    request.getDisplayName(),
                    request.getUsername(),
                    request.getPassword()
            );
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    @PatchMapping("/users/{userId}/password")
    public ResponseEntity<Void> resetPassword(@PathVariable UUID userId,
                                               @Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(userId, request.getNewPassword());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}
