package com.sdlcassist.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class PromptService {

    @Value("${app.prompts.directory:}")
    private String promptsDirectory;

    private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

    public String getPrompt(String name) {
        return cache.computeIfAbsent(name, this::loadPrompt);
    }

    public void clearCache() {
        cache.clear();
    }

    private String loadPrompt(String name) {
        // Try filesystem first if directory is configured
        if (promptsDirectory != null && !promptsDirectory.isBlank()) {
            Path filePath = Path.of(promptsDirectory, name + ".txt");
            if (Files.exists(filePath)) {
                try {
                    log.info("Loading prompt '{}' from filesystem: {}", name, filePath);
                    return Files.readString(filePath, StandardCharsets.UTF_8);
                } catch (IOException e) {
                    log.warn("Failed to read prompt from filesystem: {}", filePath, e);
                }
            }
        }

        // Fall back to classpath
        try {
            var resource = new ClassPathResource("prompts/" + name + ".txt");
            log.info("Loading prompt '{}' from classpath", name);
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Prompt not found: " + name, e);
        }
    }
}
