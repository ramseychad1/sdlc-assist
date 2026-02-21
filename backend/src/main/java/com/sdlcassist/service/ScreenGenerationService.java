package com.sdlcassist.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.sdlcassist.dto.ScreenDefinitionDto;
import com.sdlcassist.model.Project;
import com.sdlcassist.model.ProjectScreen;
import com.sdlcassist.repository.ProjectScreenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScreenGenerationService {

    private final ProjectService projectService;
    private final ProjectScreenRepository screenRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.vertexai.project-id}")
    private String gcpProjectId;

    @Value("${app.vertexai.location}")
    private String location;

    @Value("${app.vertexai.screen-generation-agent-resource-id}")
    private String agentResourceId;

    @Value("${app.vertexai.service-account-json:}")
    private String serviceAccountJson;

    // -------------------------------------------------------------------------
    // SSE stream — generate prototype for one screen
    // -------------------------------------------------------------------------
    public void generatePrototype(UUID projectId, UUID screenId, SseEmitter emitter) {
        try {
            sendProgress(emitter, "INITIALIZING", 5, "Connecting to screen generation agent...");

            Project project = projectService.findById(projectId);
            if (project.getPrdContent() == null || project.getPrdContent().isBlank()) {
                sendError(emitter, "No PRD found. Generate a PRD in the Planning phase first.");
                return;
            }
            if (project.getDesignSystemContent() == null || project.getDesignSystemContent().isBlank()) {
                sendError(emitter, "No design system found. Complete the Design System step first.");
                return;
            }

            ProjectScreen screen = screenRepository.findById(screenId)
                    .orElseThrow(() -> new RuntimeException("Screen not found: " + screenId));

            sendProgress(emitter, "LOADING_CONTEXT", 15, "Loading PRD and design system...");
            Thread.sleep(500);
            sendProgress(emitter, "ANALYZING_SCREEN", 30, "Analyzing screen requirements for \"" + screen.getName() + "\"...");

            String accessToken = getAccessToken();
            String sessionId = createSession(accessToken, projectId.toString());
            log.info("Screen generation session created: {} for screen: {}", sessionId, screen.getName());

            // Persist session ID so refinement can reuse it
            screen.setVertexSessionId(sessionId);
            screenRepository.save(screen);

            String userMessage = buildMessage(screen, project);

            sendProgress(emitter, "GENERATING", 50, "Generating HTML prototype...");

            // Blocking agent call — may take 30-90 seconds for complex screens
            String agentResponse = streamQuery(accessToken, sessionId, projectId.toString(), userMessage);

            sendProgress(emitter, "APPLYING_STYLES", 75, "Applying design system tokens...");
            Thread.sleep(400);
            sendProgress(emitter, "FINALIZING", 92, "Finalizing prototype...");
            Thread.sleep(300);

            // Parse the JSON response from the agent
            ParsedPrototype parsed = parsePrototypeResponse(agentResponse, screen.getName());

            if (parsed.htmlContent() == null || parsed.htmlContent().isBlank()) {
                sendError(emitter, "Agent returned empty prototype. Please try again.");
                return;
            }

            String completePayload = objectMapper.writeValueAsString(Map.of(
                    "event", "COMPLETE",
                    "progress", 100,
                    "message", "Prototype generated successfully.",
                    "htmlContent", parsed.htmlContent(),
                    "designNotes", parsed.designNotes()
            ));
            emitter.send(SseEmitter.event().name("progress").data(completePayload));
            emitter.complete();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            try { sendError(emitter, "Generation interrupted"); } catch (Exception ignored) {}
        } catch (Exception e) {
            log.error("Prototype generation failed for screen {}", screenId, e);
            try { sendError(emitter, "Generation failed: " + e.getMessage()); } catch (Exception ignored) {}
        } finally {
            try { emitter.complete(); } catch (Exception ignored) {}
        }
    }

    // -------------------------------------------------------------------------
    // Save prototype HTML to the screen record
    // -------------------------------------------------------------------------
    public ScreenDefinitionDto savePrototype(UUID projectId, UUID screenId, String htmlContent) {
        ProjectScreen screen = screenRepository.findById(screenId)
                .orElseThrow(() -> new RuntimeException("Screen not found: " + screenId));

        if (!screen.getProjectId().equals(projectId)) {
            throw new RuntimeException("Screen does not belong to this project");
        }

        screen.setPrototypeContent(htmlContent);
        screen.setPrototypeGeneratedAt(Instant.now());
        ProjectScreen saved = screenRepository.save(screen);
        return toDto(saved);
    }

    // -------------------------------------------------------------------------
    // SSE stream — refine an existing prototype via chat message
    // -------------------------------------------------------------------------
    public void refinePrototype(UUID projectId, UUID screenId, String userMessage, SseEmitter emitter) {
        try {
            log.info("refinePrototype START — projectId={}, screenId={}, message={}", projectId, screenId,
                    userMessage.substring(0, Math.min(80, userMessage.length())));
            sendProgress(emitter, "THINKING", 0, "Connecting to agent...");

            ProjectScreen screen = screenRepository.findById(screenId)
                    .orElseThrow(() -> new RuntimeException("Screen not found: " + screenId));

            if (!screen.getProjectId().equals(projectId)) {
                sendError(emitter, "Screen does not belong to this project");
                return;
            }

            if (screen.getPrototypeContent() == null || screen.getPrototypeContent().isBlank()) {
                sendError(emitter, "No prototype found for this screen. Generate it first.");
                return;
            }

            String accessToken = getAccessToken();
            String sessionId = screen.getVertexSessionId();

            // Build the refinement message with explicit instructions
            String refinementMessage = userMessage.trim() +
                    "\n\nReturn ONLY the complete updated HTML document. No explanation. No markdown code fences. " +
                    "Start with <!DOCTYPE html> and end with </html>.";

            // If no session exists, create one and replay context
            if (sessionId == null || sessionId.isBlank()) {
                log.info("No session ID for screen {}, creating new session for refinement", screenId);
                sessionId = createSession(accessToken, projectId.toString());
                screen.setVertexSessionId(sessionId);
                screenRepository.save(screen);

                // Replay context: send current prototype as initial context
                String contextMessage = "Here is the current prototype HTML you previously generated:\n\n" +
                        screen.getPrototypeContent() +
                        "\n\nNow apply the following change: " + refinementMessage;
                refinementMessage = contextMessage;
            }

            String agentResponse;
            try {
                agentResponse = streamQuery(accessToken, sessionId, projectId.toString(), refinementMessage);
            } catch (Exception sessionException) {
                log.warn("Session {} may have expired, creating new session for screen {}: {}",
                        sessionId, screenId, sessionException.getMessage());

                // Session expired — create new session with context replay
                String newSessionId = createSession(accessToken, projectId.toString());
                screen.setVertexSessionId(newSessionId);
                screenRepository.save(screen);

                String contextMessage = "Here is the current prototype HTML you previously generated:\n\n" +
                        screen.getPrototypeContent() +
                        "\n\nNow apply the following change: " + userMessage.trim() +
                        "\n\nReturn ONLY the complete updated HTML document. No explanation. No markdown code fences. " +
                        "Start with <!DOCTYPE html> and end with </html>.";

                agentResponse = streamQuery(accessToken, newSessionId, projectId.toString(), contextMessage);
            }

            String refinedHtml = parseRefinementResponse(agentResponse);

            if (refinedHtml == null || refinedHtml.isBlank()) {
                sendError(emitter, "Agent returned empty response. Please try again.");
                return;
            }

            String completePayload = objectMapper.writeValueAsString(Map.of(
                    "event", "COMPLETE",
                    "refinedHtml", refinedHtml
            ));
            emitter.send(SseEmitter.event().name("refine").data(completePayload));
            emitter.complete();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            try { sendError(emitter, "Refinement interrupted"); } catch (Exception ignored) {}
        } catch (Exception e) {
            log.error("Prototype refinement failed for screen {}", screenId, e);
            try { sendError(emitter, "Refinement failed: " + e.getMessage()); } catch (Exception ignored) {}
        } finally {
            try { emitter.complete(); } catch (Exception ignored) {}
        }
    }

    // -------------------------------------------------------------------------
    // Parse refinement response — agent returns raw HTML
    // -------------------------------------------------------------------------
    private String parseRefinementResponse(String response) {
        if (response == null || response.isBlank()) return null;

        String candidate = response.trim();

        // Strip markdown code fences (```html ... ``` or ``` ... ```)
        Pattern fencePattern = Pattern.compile("```(?:html)?\\s*([\\s\\S]*?)```", Pattern.DOTALL);
        Matcher fenceMatcher = fencePattern.matcher(candidate);
        if (fenceMatcher.find()) {
            candidate = fenceMatcher.group(1).trim();
        }

        // Accept raw HTML
        if (candidate.contains("<!DOCTYPE") || candidate.contains("<html")) {
            return candidate;
        }

        // Agent may still return JSON wrapper {"htmlContent":"..."} — extract it
        try {
            JsonNode root = objectMapper.readTree(candidate);
            String html = getJsonString(root, "htmlContent");
            if (html != null && (html.contains("<!DOCTYPE") || html.contains("<html"))) {
                log.info("Refinement: extracted htmlContent from JSON wrapper ({} chars)", html.length());
                return html;
            }
        } catch (Exception e) {
            // Not valid JSON — try finding JSON object boundary
            int start = candidate.indexOf('{');
            if (start >= 0) {
                int depth = 0, end = -1;
                for (int i = start; i < candidate.length(); i++) {
                    char c = candidate.charAt(i);
                    if (c == '{') depth++;
                    else if (c == '}') { depth--; if (depth == 0) { end = i; break; } }
                }
                if (end > start) {
                    try {
                        JsonNode root = objectMapper.readTree(candidate.substring(start, end + 1));
                        String html = getJsonString(root, "htmlContent");
                        if (html != null && (html.contains("<!DOCTYPE") || html.contains("<html"))) {
                            log.info("Refinement: extracted htmlContent from partial JSON ({} chars)", html.length());
                            return html;
                        }
                    } catch (Exception ignored) {}
                }
            }
        }

        log.error("Refinement: could not parse HTML from agent response. First 300 chars: {}",
                response.substring(0, Math.min(300, response.length())));
        return null;
    }

    // -------------------------------------------------------------------------
    // Step 1: Create session
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
        log.info("screen_generation create_session status: {}", response.statusCode());

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

        log.info("Sending screen_generation streamQuery for session: {}", sessionId);
        HttpResponse<java.io.InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
        log.info("screen_generation streamQuery status: {}", response.statusCode());

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
                    log.debug("Skipping unparseable line: {}", data.substring(0, Math.min(100, data.length())));
                }
            }
        }

        if (result.isEmpty()) {
            log.warn("screen_generation streamQuery returned no text");
        } else {
            log.info("screen_generation agent returned {} chars", result.length());
        }
        return result.toString();
    }

    // -------------------------------------------------------------------------
    // Parse text from a single ADK event
    // -------------------------------------------------------------------------
    private String extractText(String data) throws Exception {
        JsonNode root = objectMapper.readTree(data);

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
    // Parse the prototype JSON response {htmlContent, cssContent, designNotes}
    // -------------------------------------------------------------------------
    private ParsedPrototype parsePrototypeResponse(String response, String screenName) {
        if (response == null || response.isBlank()) {
            return new ParsedPrototype(null, "");
        }

        String candidate = response.trim();

        // Strip markdown code fences
        Pattern fencePattern = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.DOTALL);
        Matcher fenceMatcher = fencePattern.matcher(candidate);
        if (fenceMatcher.find()) {
            candidate = fenceMatcher.group(1).trim();
        }

        // Try to parse as JSON directly
        try {
            JsonNode root = objectMapper.readTree(candidate);
            String html = getJsonString(root, "htmlContent");
            String notes = getJsonString(root, "designNotes");
            if (html != null && !html.isBlank()) {
                log.info("Parsed prototype JSON: htmlContent={} chars, designNotes={} chars",
                        html.length(), notes != null ? notes.length() : 0);
                return new ParsedPrototype(html, notes != null ? notes : "");
            }
        } catch (Exception e) {
            log.debug("Direct JSON parse failed, trying extraction: {}", e.getMessage());
        }

        // Find outermost JSON object by locating first '{' and matching '}'
        int start = candidate.indexOf('{');
        if (start >= 0) {
            int depth = 0;
            int end = -1;
            for (int i = start; i < candidate.length(); i++) {
                char c = candidate.charAt(i);
                if (c == '{') depth++;
                else if (c == '}') {
                    depth--;
                    if (depth == 0) { end = i; break; }
                }
            }
            if (end > start) {
                try {
                    JsonNode root = objectMapper.readTree(candidate.substring(start, end + 1));
                    String html = getJsonString(root, "htmlContent");
                    String notes = getJsonString(root, "designNotes");
                    if (html != null && !html.isBlank()) {
                        log.info("Extracted prototype JSON: htmlContent={} chars", html.length());
                        return new ParsedPrototype(html, notes != null ? notes : "");
                    }
                } catch (Exception e) {
                    log.debug("Extracted JSON parse failed: {}", e.getMessage());
                }
            }
        }

        // Last resort: if the response looks like raw HTML, wrap it
        if (candidate.contains("<!DOCTYPE") || candidate.contains("<html")) {
            log.warn("Agent returned raw HTML without JSON wrapper for screen: {}", screenName);
            return new ParsedPrototype(candidate, "");
        }

        log.error("Could not parse prototype from agent response. First 500 chars: {}",
                response.substring(0, Math.min(500, response.length())));
        return new ParsedPrototype(null, "");
    }

    private String getJsonString(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isTextual()) return value.asText();
        if (!value.isMissingNode() && !value.isNull()) return value.toString();
        return null;
    }

    // -------------------------------------------------------------------------
    // Build the message sent to the screen_generation_agent
    // -------------------------------------------------------------------------
    private String buildMessage(ProjectScreen screen, Project project) {
        String screenJson;
        try {
            screenJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(Map.of(
                    "id", screen.getId().toString(),
                    "name", screen.getName(),
                    "description", screen.getDescription() != null ? screen.getDescription() : "",
                    "screenType", screen.getScreenType() != null ? screen.getScreenType() : "list",
                    "epicName", screen.getEpicName() != null ? screen.getEpicName() : "",
                    "complexity", screen.getComplexity() != null ? screen.getComplexity() : "medium",
                    "userRole", screen.getUserRole() != null ? screen.getUserRole() : "",
                    "notes", screen.getNotes() != null ? screen.getNotes() : ""
            ));
        } catch (Exception e) {
            screenJson = "{\"name\": \"" + screen.getName() + "\"}";
        }

        return """
                SCREEN DEFINITION:
                %s

                PRD CONTENT:
                %s

                DESIGN SYSTEM:
                %s

                TEMPLATE ID: %s

                Generate the HTML prototype for the screen definition above. \
                Return ONLY a JSON object (no markdown, no preamble) with these exact fields:
                - htmlContent: complete standalone HTML page with inline CSS
                - cssContent: the full CSS (also embedded in htmlContent)
                - designNotes: 2-3 sentence explanation of key design decisions
                """.formatted(
                screenJson,
                project.getPrdContent(),
                project.getDesignSystemContent(),
                project.getSelectedTemplateId() != null ? project.getSelectedTemplateId() : "default"
        );
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

    private ScreenDefinitionDto toDto(ProjectScreen screen) {
        return ScreenDefinitionDto.builder()
                .id(screen.getId().toString())
                .projectId(screen.getProjectId().toString())
                .name(screen.getName())
                .description(screen.getDescription())
                .screenType(screen.getScreenType())
                .epicName(screen.getEpicName())
                .complexity(screen.getComplexity())
                .userRole(screen.getUserRole())
                .notes(screen.getNotes())
                .prototypeContent(screen.getPrototypeContent())
                .displayOrder(screen.getDisplayOrder())
                .createdAt(screen.getCreatedAt())
                .prototypeGeneratedAt(screen.getPrototypeGeneratedAt())
                .build();
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

    // -------------------------------------------------------------------------
    // Value record for parsed prototype
    // -------------------------------------------------------------------------
    private record ParsedPrototype(String htmlContent, String designNotes) {}
}
