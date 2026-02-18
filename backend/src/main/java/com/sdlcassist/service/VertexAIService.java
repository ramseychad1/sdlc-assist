package com.sdlcassist.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.sdlcassist.model.ProjectFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
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
public class VertexAIService {

    private final FileService fileService;
    private final ObjectMapper objectMapper;

    @Value("${app.vertexai.project-id}")
    private String projectId;

    @Value("${app.vertexai.location}")
    private String location;

    @Value("${app.vertexai.agent-resource-id}")
    private String agentResourceId;

    @Value("${app.vertexai.service-account-json:}")
    private String serviceAccountJson;

    public String analyzeRequirements(UUID projectId) {
        String combinedText = collectExtractedText(projectId);
        String userMessage = buildUserMessage(combinedText);

        log.info("Calling Vertex AI agent for project {}, message length: {} chars",
                projectId, userMessage.length());

        try {
            String accessToken = getAccessToken();

            // Step 1: Create a session
            String sessionId = createSession(accessToken, projectId.toString());
            log.info("Created Vertex AI session: {}", sessionId);

            // Step 2: Send message via :streamQuery and collect the full response
            String result = streamQuery(accessToken, sessionId, projectId.toString(), userMessage);
            log.info("Vertex AI agent response collected ({} chars)", result.length());
            return result;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Vertex AI call interrupted", e);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to call Vertex AI agent", e);
            throw new RuntimeException("Failed to call Vertex AI agent: " + e.getMessage(), e);
        }
    }

    // -------------------------------------------------------------------------
    // Step 1: Create session via POST :query with class_method=create_session
    // -------------------------------------------------------------------------
    @SuppressWarnings("unchecked")
    private String createSession(String accessToken, String userId) throws Exception {
        String endpoint = baseUrl() + ":query";

        Map<String, Object> body = Map.of(
                "class_method", "create_session",
                "input", Map.of("user_id", userId)
        );

        HttpResponse<String> response = post(endpoint, accessToken, objectMapper.writeValueAsString(body));
        log.info("create_session responded with status {}", response.statusCode());

        if (response.statusCode() != 200) {
            log.error("create_session error: status={}, body={}", response.statusCode(), response.body());
            throw new RuntimeException("Vertex AI create_session error " + response.statusCode() + ": " + response.body());
        }

        // Response: {"output": {"id": "session_id", ...}}
        JsonNode root = objectMapper.readTree(response.body());
        log.debug("create_session raw response: {}", response.body());

        JsonNode output = root.path("output");
        if (output.has("id")) {
            return output.get("id").asText();
        }
        // Some versions wrap the session differently
        if (output.isTextual()) {
            return output.asText();
        }
        throw new RuntimeException("Could not extract session ID from create_session response: " + response.body());
    }

    // -------------------------------------------------------------------------
    // Step 2: Send message via POST :streamQuery, collect SSE text chunks
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

        log.info("Sending streamQuery to Vertex AI: {}", endpoint);
        HttpResponse<java.io.InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());

        log.info("streamQuery responded with status {}", response.statusCode());

        if (response.statusCode() != 200) {
            String errorBody = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
            log.error("streamQuery error: status={}, body={}", response.statusCode(), errorBody);
            throw new RuntimeException("Vertex AI streamQuery error " + response.statusCode() + ": " + errorBody);
        }

        // Read SSE stream and collect all text parts
        StringBuilder result = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.startsWith("data: ")) continue;
                String data = line.substring(6).trim();
                if (data.isEmpty() || data.equals("[DONE]")) continue;

                try {
                    String text = extractTextFromEvent(data);
                    if (text != null && !text.isEmpty()) {
                        result.append(text);
                    }
                } catch (Exception parseEx) {
                    log.debug("Skipping unparseable SSE line: {}", data);
                }
            }
        }

        if (result.isEmpty()) {
            log.warn("streamQuery returned no text — check raw SSE events in DEBUG logs");
        }
        return result.toString();
    }

    // -------------------------------------------------------------------------
    // Parse a single SSE event from the agent and extract any text content
    // -------------------------------------------------------------------------
    private String extractTextFromEvent(String data) throws Exception {
        log.debug("SSE event: {}", data);
        JsonNode root = objectMapper.readTree(data);

        // Shape 1: {"output": {"content": {"parts": [{"text": "..."}]}}}
        JsonNode output = root.path("output");
        if (!output.isMissingNode()) {
            // Direct text output
            if (output.isTextual()) return output.asText();

            JsonNode content = output.path("content");
            if (!content.isMissingNode()) {
                JsonNode parts = content.path("parts");
                if (parts.isArray()) {
                    StringBuilder sb = new StringBuilder();
                    for (JsonNode part : parts) {
                        if (part.has("text")) sb.append(part.get("text").asText());
                    }
                    return sb.toString();
                }
                if (content.isTextual()) return content.asText();
            }

            // Shape 2: {"output": {"text": "..."}}
            if (output.has("text")) return output.get("text").asText();
        }

        // Shape 3: top-level text
        if (root.has("text")) return root.get("text").asText();

        return null;
    }

    // -------------------------------------------------------------------------
    // Auth: service account JSON env var (Railway) or ADC (local dev)
    // -------------------------------------------------------------------------
    private String getAccessToken() throws Exception {
        GoogleCredentials credentials;

        if (serviceAccountJson != null && !serviceAccountJson.isBlank()) {
            log.debug("Using GOOGLE_SERVICE_ACCOUNT_JSON env var for credentials");
            credentials = GoogleCredentials
                    .fromStream(new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8)))
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
        } else {
            log.debug("Using Application Default Credentials");
            credentials = GoogleCredentials.getApplicationDefault()
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
        }

        credentials.refreshIfExpired();
        return credentials.getAccessToken().getTokenValue();
    }

    private String baseUrl() {
        return String.format(
                "https://%s-aiplatform.googleapis.com/v1beta1/projects/%s/locations/%s/reasoningEngines/%s",
                location, projectId, location, agentResourceId
        );
    }

    private HttpResponse<String> post(String url, String accessToken, String jsonBody) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + accessToken)
                .timeout(Duration.ofMinutes(2))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private String buildUserMessage(String documentsContent) {
        return "Generate a comprehensive Product Requirements Document (PRD) based on the following uploaded project documents. " +
                "Format the output as clean Markdown.\n\n" + documentsContent;
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

        log.info("Vertex AI analyzing project {} with {} files, {} chars of text",
                projectId, files.size(), combinedText.length());

        return combinedText;
    }
}
