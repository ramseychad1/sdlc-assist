package com.sdlcassist.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdlcassist.model.ProjectFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final FileService fileService;
    private final PromptService promptService;
    private final ObjectMapper objectMapper;

    @Value("${app.anthropic.api-key:}")
    private String apiKey;

    @Value("${app.anthropic.model:claude-sonnet-4-5-20250929}")
    private String model;

    @Value("${app.anthropic.max-tokens:20000}")
    private int maxTokens;

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

    @SuppressWarnings("unchecked")
    public String analyzeRequirements(UUID projectId) {
        validateApiKey();
        String combinedText = collectExtractedText(projectId);
        String systemPrompt = promptService.getPrompt("planning-analysis");

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "max_tokens", maxTokens,
                    "system", systemPrompt,
                    "messages", List.of(
                            Map.of("role", "user", "content", combinedText)
                    )
            );

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            log.debug("Request body length: {} chars", jsonBody.length());

            HttpResponse<String> response = sendAnthropicRequest(jsonBody, HttpResponse.BodyHandlers.ofString());
            log.info("Anthropic API responded with status {}", response.statusCode());

            if (response.statusCode() != 200) {
                log.error("Anthropic API error: status={}, body={}", response.statusCode(), response.body());
                throw new RuntimeException("Anthropic API error " + response.statusCode() + ": " + response.body());
            }

            Map<String, Object> responseBody = objectMapper.readValue(response.body(), Map.class);
            List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
            if (content == null || content.isEmpty()) {
                throw new RuntimeException("No content in Anthropic API response");
            }

            return (String) content.get(0).get("text");

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("API call interrupted", e);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to call Anthropic API", e);
            throw new RuntimeException("Failed to call Anthropic API: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public void streamAnalysis(UUID projectId, SseEmitter emitter) {
        validateApiKey();
        String combinedText = collectExtractedText(projectId);
        String systemPrompt = promptService.getPrompt("planning-analysis");

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "max_tokens", maxTokens,
                    "stream", true,
                    "system", systemPrompt,
                    "messages", List.of(
                            Map.of("role", "user", "content", combinedText)
                    )
            );

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            log.debug("Streaming request body length: {} chars", jsonBody.length());

            HttpResponse<java.io.InputStream> response = sendAnthropicRequest(
                    jsonBody, HttpResponse.BodyHandlers.ofInputStream());
            log.info("Anthropic streaming API responded with status {}", response.statusCode());

            if (response.statusCode() != 200) {
                String errorBody = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
                log.error("Anthropic API error: status={}, body={}", response.statusCode(), errorBody);
                emitter.send(SseEmitter.event().name("error").data("API error: " + response.statusCode()));
                emitter.complete();
                return;
            }

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.startsWith("data: ")) {
                        continue;
                    }

                    String data = line.substring(6).trim();
                    if (data.equals("[DONE]") || data.isEmpty()) {
                        continue;
                    }

                    try {
                        Map<String, Object> event = objectMapper.readValue(data, Map.class);
                        String type = (String) event.get("type");

                        if ("content_block_delta".equals(type)) {
                            Map<String, Object> delta = (Map<String, Object>) event.get("delta");
                            if (delta != null) {
                                String text = (String) delta.get("text");
                                if (text != null) {
                                    emitter.send(SseEmitter.event().name("delta").data(text));
                                }
                            }
                        } else if ("message_delta".equals(type)) {
                            Map<String, Object> delta = (Map<String, Object>) event.get("delta");
                            if (delta != null) {
                                String stopReason = (String) delta.get("stop_reason");
                                if (stopReason != null) {
                                    log.info("Stream stop_reason: {}", stopReason);
                                }
                            }
                        } else if ("message_stop".equals(type)) {
                            emitter.send(SseEmitter.event().name("done").data(""));
                            emitter.complete();
                            return;
                        } else if ("error".equals(type)) {
                            Map<String, Object> error = (Map<String, Object>) event.get("error");
                            String message = error != null ? (String) error.get("message") : "Unknown error";
                            log.error("Anthropic stream error: {}", message);
                            emitter.send(SseEmitter.event().name("error").data(message));
                            emitter.complete();
                            return;
                        }
                    } catch (Exception parseEx) {
                        log.debug("Skipping unparseable stream line: {}", data);
                    }
                }
            }

            // Stream ended without message_stop — send done anyway
            emitter.send(SseEmitter.event().name("done").data(""));
            emitter.complete();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            try {
                emitter.send(SseEmitter.event().name("error").data("Stream interrupted"));
                emitter.complete();
            } catch (Exception ignored) {}
        } catch (Exception e) {
            log.error("Streaming analysis failed", e);
            try {
                emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                emitter.complete();
            } catch (Exception ignored) {}
        }
    }

    private void validateApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Anthropic API key is not configured");
        }
    }

    private String collectExtractedText(UUID projectId) {
        List<ProjectFile> files = fileService.getFilesByProject(projectId);
        if (files.isEmpty()) {
            throw new IllegalArgumentException("No files uploaded for this project. Upload documents first.");
        }

        String combinedText = files.stream()
                .filter(f -> f.getExtractedText() != null && !f.getExtractedText().isBlank())
                .map(f -> "=== " + f.getOriginalFilename() + " ===\n" + f.getExtractedText())
                .collect(Collectors.joining("\n\n"));

        if (combinedText.isBlank()) {
            throw new IllegalArgumentException("No text could be extracted from the uploaded files.");
        }

        log.info("Analyzing requirements for project {} with {} files, {} chars of text",
                projectId, files.size(), combinedText.length());

        return combinedText;
    }

    private <T> HttpResponse<T> sendAnthropicRequest(String jsonBody, HttpResponse.BodyHandler<T> bodyHandler)
            throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(ANTHROPIC_API_URL))
                .header("Content-Type", "application/json")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .timeout(Duration.ofMinutes(5))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        log.info("Sending request to Anthropic API...");
        return client.send(request, bodyHandler);
    }
}
