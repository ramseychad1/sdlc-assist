package com.sdlcassist.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.sdlcassist.model.Project;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DesignSystemService {

    private final ProjectService projectService;
    private final ObjectMapper objectMapper;

    @Value("${app.vertexai.project-id}")
    private String gcpProjectId;

    @Value("${app.vertexai.location}")
    private String location;

    @Value("${app.vertexai.design-system-agent-resource-id}")
    private String agentResourceId;

    @Value("${app.vertexai.service-account-json:}")
    private String serviceAccountJson;

    public void generateDesignSystem(UUID projectId, SseEmitter emitter) {
        try {
            sendProgress(emitter, "INITIALIZING", 5, "Connecting to design system agent...");

            Project project = projectService.findById(projectId);
            if (project.getPrdContent() == null || project.getPrdContent().isBlank()) {
                sendError(emitter, "No PRD found. Generate a PRD in the Planning phase first.");
                return;
            }

            // Load template metadata from classpath
            JsonNode templateMetadata = loadTemplateMetadata(project.getSelectedTemplateId());

            String accessToken = getAccessToken();
            String sessionId = createSession(accessToken, projectId.toString());
            log.info("Design system session created: {}", sessionId);

            sendProgress(emitter, "ANALYZING_PRD", 20, "Analyzing PRD requirements...");
            Thread.sleep(800);
            sendProgress(emitter, "EXTRACTING_DOMAIN", 35, "Identifying domain patterns and use cases...");

            // Build template-aware progress message
            String templateName = templateMetadata != null && templateMetadata.has("name")
                    ? templateMetadata.get("name").asText()
                    : "selected template";
            Thread.sleep(600);
            sendProgress(emitter, "APPLYING_TEMPLATE", 50, "Applying " + templateName + " design tokens...");

            // Build the message and call the agent (blocking — slow)
            String userMessage = buildMessage(project.getPrdContent(), templateMetadata);
            String agentResponse = streamQuery(accessToken, sessionId, projectId.toString(), userMessage);

            // Emit quick final progression after agent responds
            sendProgress(emitter, "GENERATING_COLORS", 65, "Generating color system and semantic tokens...");
            Thread.sleep(400);
            sendProgress(emitter, "GENERATING_TYPOGRAPHY", 75, "Defining typography scale and hierarchy...");
            Thread.sleep(400);
            sendProgress(emitter, "GENERATING_COMPONENTS", 85, "Specifying component library...");
            Thread.sleep(400);
            sendProgress(emitter, "FINALIZING", 95, "Finalizing design system document...");
            Thread.sleep(300);

            // Emit COMPLETE with content
            String completePayload = objectMapper.writeValueAsString(Map.of(
                    "event", "COMPLETE",
                    "progress", 100,
                    "message", "Design system generated successfully.",
                    "content", agentResponse
            ));
            emitter.send(SseEmitter.event().name("progress").data(completePayload));
            emitter.complete();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            try { sendError(emitter, "Generation interrupted"); } catch (Exception ignored) {}
        } catch (Exception e) {
            log.error("Design system generation failed for project {}", projectId, e);
            try { sendError(emitter, "Generation failed: " + e.getMessage()); } catch (Exception ignored) {}
        } finally {
            try { emitter.complete(); } catch (Exception ignored) {}
        }
    }

    private JsonNode loadTemplateMetadata(String templateId) {
        if (templateId == null || templateId.isBlank()) return null;
        try {
            ClassPathResource resource = new ClassPathResource("templates/" + templateId + "/metadata.json");
            return objectMapper.readTree(resource.getInputStream());
        } catch (Exception e) {
            log.warn("Could not load template metadata for '{}': {}", templateId, e.getMessage());
            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Step 1: Create session via POST :query with class_method=create_session
    // -------------------------------------------------------------------------
    private String createSession(String accessToken, String userId) throws Exception {
        String endpoint = baseUrl() + ":query";
        Map<String, Object> body = Map.of(
                "class_method", "create_session",
                "input", Map.of("user_id", userId)
        );

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + accessToken)
                .timeout(Duration.ofMinutes(2))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        log.info("design_system create_session status: {}", response.statusCode());

        if (response.statusCode() != 200) {
            throw new RuntimeException("create_session error " + response.statusCode() + ": " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode output = root.path("output");
        if (output.has("id")) return output.get("id").asText();
        if (output.isTextual()) return output.asText();
        throw new RuntimeException("Could not extract session ID: " + response.body());
    }

    // -------------------------------------------------------------------------
    // Step 2: POST :streamQuery, read response line-by-line
    // -------------------------------------------------------------------------
    private String streamQuery(String accessToken, String sessionId, String userId, String message) throws Exception {
        String endpoint = baseUrl() + ":streamQuery";
        Map<String, Object> body = Map.of(
                "input", Map.of(
                        "session_id", sessionId,
                        "user_id", userId,
                        "message", message
                )
        );

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + accessToken)
                .timeout(Duration.ofMinutes(5))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        log.info("Sending design_system streamQuery to: {}", endpoint);
        HttpResponse<java.io.InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
        log.info("design_system streamQuery status: {}", response.statusCode());

        if (response.statusCode() != 200) {
            String errorBody = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
            throw new RuntimeException("streamQuery error " + response.statusCode() + ": " + errorBody);
        }

        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;

                String data = line.startsWith("data: ") ? line.substring(6).trim() : line;
                if (data.isEmpty() || data.equals("[DONE]")) continue;

                try {
                    String text = extractText(data);
                    if (text != null && !text.isEmpty()) result.append(text);
                } catch (Exception e) {
                    log.debug("Skipping unparseable line: {}", data);
                }
            }
        }

        if (result.isEmpty()) {
            log.warn("design_system streamQuery returned no text");
        } else {
            log.info("design_system agent returned {} chars", result.length());
        }
        return result.toString();
    }

    // -------------------------------------------------------------------------
    // Parse text from a single ADK event (handles common shapes)
    // -------------------------------------------------------------------------
    private String extractText(String data) throws Exception {
        JsonNode root = objectMapper.readTree(data);

        // Shape: {"output": {"content": {"parts": [{"text": "..."}]}}}
        JsonNode output = root.path("output");
        if (!output.isMissingNode()) {
            if (output.isTextual()) return output.asText();
            JsonNode content = output.path("content");
            if (!content.isMissingNode()) {
                JsonNode parts = content.path("parts");
                if (parts.isArray()) {
                    StringBuilder sb = new StringBuilder();
                    for (JsonNode part : parts) {
                        if (part.has("text")) sb.append(part.get("text").asText());
                    }
                    if (!sb.isEmpty()) return sb.toString();
                }
            }
            if (output.has("text")) return output.get("text").asText();
        }

        // Shape: {"content": {"parts": [{"text": "..."}]}}
        JsonNode content = root.path("content");
        if (!content.isMissingNode()) {
            JsonNode parts = content.path("parts");
            if (parts.isArray()) {
                StringBuilder sb = new StringBuilder();
                for (JsonNode part : parts) {
                    if (part.has("text")) sb.append(part.get("text").asText());
                }
                if (!sb.isEmpty()) return sb.toString();
            }
        }

        // Shape: {"candidates": [...]}
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode candidate : candidates) {
                JsonNode parts = candidate.path("content").path("parts");
                if (parts.isArray()) {
                    for (JsonNode part : parts) {
                        if (part.has("text")) sb.append(part.get("text").asText());
                    }
                }
            }
            if (!sb.isEmpty()) return sb.toString();
        }

        if (root.has("text")) return root.get("text").asText();
        return null;
    }

    // -------------------------------------------------------------------------
    // Build the message sent to the design_system_agent
    // -------------------------------------------------------------------------
    private String buildMessage(String prdContent, JsonNode templateMetadata) {
        StringBuilder msg = new StringBuilder();
        msg.append("Generate a comprehensive design system document for the following project.\n\n");

        if (templateMetadata != null) {
            String name = templateMetadata.has("name") ? templateMetadata.get("name").asText() : "Enterprise";
            String tag = templateMetadata.has("tag") ? templateMetadata.get("tag").asText() : "";
            String promptHint = templateMetadata.has("promptHint") ? templateMetadata.get("promptHint").asText() : "";
            String description = templateMetadata.has("description") ? templateMetadata.get("description").asText() : "";

            msg.append("SELECTED TEMPLATE: ").append(name);
            if (!tag.isBlank()) msg.append(" (").append(tag).append(")");
            msg.append("\n");
            if (!description.isBlank()) msg.append(description).append("\n");
            msg.append("\n");

            if (!promptHint.isBlank()) {
                msg.append("DESIGN GUIDANCE:\n").append(promptHint).append("\n\n");
            }

            JsonNode tokens = templateMetadata.path("designTokens");
            if (!tokens.isMissingNode() && tokens.isObject()) {
                msg.append("DESIGN TOKENS:\n");
                tokens.fields().forEachRemaining(e ->
                        msg.append("  ").append(e.getKey()).append(": ").append(e.getValue().asText()).append("\n")
                );
                msg.append("\n");
            }

            JsonNode components = templateMetadata.path("components");
            if (components.isArray() && !components.isEmpty()) {
                msg.append("COMPONENT LIBRARY: ");
                components.forEach(c -> msg.append(c.asText()).append(", "));
                msg.append("\n\n");
            }
        }

        msg.append("PROJECT PRD:\n").append(prdContent).append("\n\n");
        msg.append("Please generate a comprehensive design system document in Markdown format with sections for: ")
           .append("Color System, Typography, Component Specifications, Layout Patterns, and Implementation Guidelines.");

        return msg.toString();
    }

    // -------------------------------------------------------------------------
    // Auth helpers
    // -------------------------------------------------------------------------
    private String getAccessToken() throws Exception {
        GoogleCredentials credentials;
        if (serviceAccountJson != null && !serviceAccountJson.isBlank()) {
            credentials = GoogleCredentials
                    .fromStream(new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8)))
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
        } else {
            credentials = GoogleCredentials.getApplicationDefault()
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
        }
        credentials.refreshIfExpired();
        return credentials.getAccessToken().getTokenValue();
    }

    private String baseUrl() {
        return String.format(
                "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/reasoningEngines/%s",
                location, gcpProjectId, location, agentResourceId
        );
    }

    // -------------------------------------------------------------------------
    // SSE helpers
    // -------------------------------------------------------------------------
    private void sendProgress(SseEmitter emitter, String event, int progress, String message) throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of(
                "event", event,
                "progress", progress,
                "message", message
        ));
        emitter.send(SseEmitter.event().name("progress").data(payload));
    }

    private void sendError(SseEmitter emitter, String message) throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of(
                "event", "ERROR",
                "message", message
        ));
        emitter.send(SseEmitter.event().name("progress").data(payload));
        emitter.complete();
    }
}
