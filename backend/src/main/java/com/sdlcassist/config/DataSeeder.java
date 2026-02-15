package com.sdlcassist.config;

import com.sdlcassist.model.User;
import com.sdlcassist.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserService userService;

    @Override
    public void run(String... args) {
        // Create default admin user if no users exist
        if (!userService.existsByUsername("admin")) {
            userService.createUser("admin", "admin123", "Admin User", User.Role.ADMIN);
            log.info("Created default admin user: admin / admin123");
        }

        if (!userService.existsByUsername("chad")) {
            userService.createUser("chad", "password", "Chad Ramsey", User.Role.ADMIN);
            log.info("Created user: chad / password");
        }
    }
}
