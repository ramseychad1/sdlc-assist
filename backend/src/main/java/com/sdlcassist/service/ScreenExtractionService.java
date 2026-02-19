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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScreenExtractionService {

    private final ProjectService projectService;
    private final ProjectScreenRepository screenRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.vertexai.project-id}")
    private String gcpProjectId;

    @Value("${app.vertexai.location}")
    private String location;

    @Value("${app.vertexai.screen-extraction-agent-resource-id}")
    private String agentResourceId;

    @Value("${app.vertexai.service-account-json:}")
    private String serviceAccountJson;

    public void extractScreens(UUID projectId, SseEmitter emitter) {
        try {
            sendProgress(emitter, "INITIALIZING", 5, "Connecting to screen extraction agent...");

            Project project = projectService.findById(projectId);
            if (project.getPrdContent() == null || project.getPrdContent().isBlank()) {
                sendError(emitter, "No PRD found. Generate a PRD in the Planning phase first.");
                return;
            }

            String accessToken = getAccessToken();
            String sessionId = createSession(accessToken, projectId.toString());
            log.info("Screen extraction session created: {}", sessionId);

            sendProgress(emitter, "READING_PRD", 15, "Reading product requirements document...");
            Thread.sleep(600);
            sendProgress(emitter, "ANALYZING_EPICS", 30, "Analyzing epics and user flows...");

            String userMessage = buildMessage(project.getPrdContent());
            // Long-running call — agent reads and processes the full PRD
            sendProgress(emitter, "EXTRACTING_FLOWS", 50, "Extracting user interaction flows...");

            String agentResponse = streamQuery(accessToken, sessionId, projectId.toString(), userMessage);

            sendProgress(emitter, "IDENTIFYING_SCREENS", 65, "Identifying distinct UI screens...");
            Thread.sleep(400);
            sendProgress(emitter, "CLASSIFYING_SCREENS", 80, "Classifying screen types and complexity...");
            Thread.sleep(400);
            sendProgress(emitter, "FINALIZING", 92, "Finalizing screen list...");
            Thread.sleep(300);

            // Parse JSON array from agent response
            List<ScreenDefinitionDto> screens = parseScreensFromResponse(agentResponse);

            if (screens.isEmpty()) {
                sendError(emitter, "Agent returned no screens. Please try again or check your PRD content.");
                return;
            }

            // Emit COMPLETE with screens array
            String screensJson = objectMapper.writeValueAsString(screens);
            String completePayload = String.format(
                    "{\"event\":\"COMPLETE\",\"progress\":100,\"message\":\"Found %d screens.\",\"screens\":%s}",
                    screens.size(), screensJson
            );
            emitter.send(SseEmitter.event().name("progress").data(completePayload));
            emitter.complete();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            try { sendError(emitter, "Extraction interrupted"); } catch (Exception ignored) {}
        } catch (Exception e) {
            log.error("Screen extraction failed for project {}", projectId, e);
            try { sendError(emitter, "Extraction failed: " + e.getMessage()); } catch (Exception ignored) {}
        } finally {
            try { emitter.complete(); } catch (Exception ignored) {}
        }
    }

    public List<ScreenDefinitionDto> getScreens(UUID projectId) {
        return screenRepository.findByProjectIdOrderByDisplayOrderAsc(projectId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<ScreenDefinitionDto> saveScreens(UUID projectId, List<ScreenDefinitionDto> dtos) {
        screenRepository.deleteByProjectId(projectId);

        List<ProjectScreen> toSave = new ArrayList<>();
        for (int i = 0; i < dtos.size(); i++) {
            ScreenDefinitionDto dto = dtos.get(i);
            ProjectScreen screen = ProjectScreen.builder()
                    .projectId(projectId)
                    .name(dto.getName())
                    .description(dto.getDescription())
                    .screenType(dto.getScreenType())
                    .epicName(dto.getEpicName())
                    .complexity(dto.getComplexity())
                    .userRole(dto.getUserRole())
                    .notes(dto.getNotes())
                    .displayOrder(i)
                    .build();
            toSave.add(screen);
        }

        return screenRepository.saveAll(toSave)
                .stream()
                .map(this::toDto)
                .toList();
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
        log.info("screen_extraction create_session status: {}", response.statusCode());

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

        log.info("Sending screen_extraction streamQuery to: {}", endpoint);
        HttpResponse<java.io.InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
        log.info("screen_extraction streamQuery status: {}", response.statusCode());

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
            log.warn("screen_extraction streamQuery returned no text");
        } else {
            log.info("screen_extraction agent returned {} chars", result.length());
        }
        return result.toString();
    }

    // -------------------------------------------------------------------------
    // Parse text from a single ADK event (handles common shapes)
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
    // Parse the screen JSON array from the agent response
    // -------------------------------------------------------------------------
    @SuppressWarnings("unchecked")
    private List<ScreenDefinitionDto> parseScreensFromResponse(String response) {
        if (response == null || response.isBlank()) return List.of();

        // Try to extract JSON array from response (may be wrapped in markdown code block)
        String jsonCandidate = response.trim();

        // Strip markdown code fences if present
        Pattern fencePattern = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.DOTALL);
        Matcher fenceMatcher = fencePattern.matcher(jsonCandidate);
        if (fenceMatcher.find()) {
            jsonCandidate = fenceMatcher.group(1).trim();
        }

        // Find first '[' and last ']' to isolate the JSON array
        int start = jsonCandidate.indexOf('[');
        int end = jsonCandidate.lastIndexOf(']');
        if (start >= 0 && end > start) {
            jsonCandidate = jsonCandidate.substring(start, end + 1);
        }

        try {
            List<Map<String, Object>> rawList = objectMapper.readValue(jsonCandidate, List.class);
            List<ScreenDefinitionDto> screens = new ArrayList<>();
            for (int i = 0; i < rawList.size(); i++) {
                Map<String, Object> raw = rawList.get(i);
                ScreenDefinitionDto dto = ScreenDefinitionDto.builder()
                        .id("temp-" + i)
                        .name(getString(raw, "name", "Screen " + (i + 1)))
                        .description(getString(raw, "description", ""))
                        .screenType(normalizeScreenType(getString(raw, "screenType", getString(raw, "screen_type", "list"))))
                        .epicName(getString(raw, "epicName", getString(raw, "epic_name", "")))
                        .complexity(normalizeComplexity(getString(raw, "complexity", "medium")))
                        .userRole(getString(raw, "userRole", getString(raw, "user_role", "")))
                        .notes(getString(raw, "notes", ""))
                        .displayOrder(i)
                        .build();
                screens.add(dto);
            }
            log.info("Parsed {} screens from agent response", screens.size());
            return screens;
        } catch (Exception e) {
            log.error("Failed to parse screens JSON from agent response. Response (first 500 chars): {}",
                    response.substring(0, Math.min(500, response.length())), e);
            return List.of();
        }
    }

    private String getString(Map<String, Object> map, String key, String defaultValue) {
        Object val = map.get(key);
        return val != null ? val.toString() : defaultValue;
    }

    private String normalizeScreenType(String raw) {
        if (raw == null) return "list";
        String lower = raw.toLowerCase().trim();
        return switch (lower) {
            case "dashboard" -> "dashboard";
            case "list" -> "list";
            case "detail" -> "detail";
            case "form" -> "form";
            case "modal" -> "modal";
            case "settings" -> "settings";
            case "auth", "login", "register" -> "auth";
            case "report" -> "report";
            case "wizard" -> "wizard";
            case "empty" -> "empty";
            default -> "list";
        };
    }

    private String normalizeComplexity(String raw) {
        if (raw == null) return "medium";
        return switch (raw.toLowerCase().trim()) {
            case "low" -> "low";
            case "high" -> "high";
            default -> "medium";
        };
    }

    // -------------------------------------------------------------------------
    // Build the message sent to the screen_extraction_agent
    // -------------------------------------------------------------------------
    private String buildMessage(String prdContent) {
        return """
                PRD Content:
                %s

                Instructions: Analyze the PRD above and identify every distinct UI screen that needs to be designed and prototyped. \
                Return ONLY a valid JSON array where each element has these exact fields:
                - name: short screen name (e.g., "User Dashboard")
                - description: what this screen does (1-2 sentences)
                - screenType: one of: dashboard, list, detail, form, modal, settings, auth, report, wizard, empty
                - epicName: which PRD epic this screen belongs to
                - complexity: low, medium, or high
                - userRole: primary user role that uses this screen
                - notes: any special implementation notes (may be empty string)

                Return ONLY the JSON array with no additional text, no markdown, no explanations.
                """.formatted(prdContent);
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
    // Mapping helpers
    // -------------------------------------------------------------------------
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
}
