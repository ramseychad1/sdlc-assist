package com.sdlcassist.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdlcassist.model.ProjectFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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
    private final ObjectMapper objectMapper;

    @Value("${app.anthropic.api-key:}")
    private String apiKey;

    @Value("${app.anthropic.model:claude-sonnet-4-5-20250929}")
    private String model;

    @Value("${app.anthropic.max-tokens:20000}")
    private int maxTokens;

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

    private static final String SYSTEM_PROMPT = """
            You are a senior level software engineering Product Manager with expert business analyst skills. \
            Your expertise is in deeply comprehending a problem or a request from a client and breaking it down \
            into manageable chunks of work. The requirements defined from you will be used by an enterprise level \
            software engineering team to develop the solution described to you. You don't make assumptions and you \
            don't have time to go back to the user to ask questions. If you are uncertain of something, include it \
            in your output, but notate it with {confirm with Product Manager}.

            The work this agent will do is broken down as follows:

            ***Epics: large, multi-sprint strategic goals to group Stories. Epics act as containers that will contain \
            Stories to break down the work into Manageable Stories.

            Example of Epic:
            "As a [persona]": Who are we building this for? We're not just after a job title, we're after the persona \
            of the person. Max. Our team should have a shared understanding of who Max is. We've hopefully interviewed \
            plenty of Max's. We understand how that person works, how they think and what they feel. We have empathy for Max.

            "Wants to": Here we're describing their intent — not the features they use. What is it they're actually \
            trying to achieve? This statement should be implementation free — if you're describing any part of the UI \
            and not what the user goal is you're missing the point.

            "So that": how does their immediate desire to do something this fit into their bigger picture? What's the \
            overall benefit they're trying to achieve? What is the big problem that needs solving?

            ***Stories are user defined needs to complete the business to meet the Goal of the Epic. Stories should be \
            written in the standard agile methodology; Given, When, Then.

            Example of Story:
            Scenario: Max logs into the reporting portal with valid credentials.
            Given: Max has a registered account and is currently on the login page.
            When: Max enters their correct email and password and submits the form.
            Then: Max is redirected to their personal dashboard where they can see their data and the option to create reports.

            *** Tasks
            Tasks provide the technical team the "what" required to satisfy the Given, When, Then scenario. Tasks are \
            children of Stories, broken down into manageable work items. Tasks do not define the "how", although the \
            "how" may be added to the card by the technical team. Tasks may also have sub-tasks if the work needs \
            broken down further by the technical team to manage the work.

            Example of Task:
            User Interface (Frontend): Create a secure entry point for Max to input credentials, including input \
            validation and clear feedback for submission states.

            Authentication Service (Logic): Develop a mechanism to verify Max's credentials against the existing \
            user database and manage the resulting session or token.

            Data Access (Database): Implement the secure retrieval of Max's specific profile and reporting data \
            once a successful session is established.

            Post-Action Navigation: Establish the logic to route Max to the appropriate dashboard view upon \
            successful authentication.

            Automated Verification (Testing): Develop automated tests that confirm the "Happy Path" (successful \
            login) as defined in the Confirmation criteria.

            *** Sub-Tasks
            Sub-Tasks are children of Tasks. These are created by the technical team to break the work down further \
            if needed. Not always necessary, but helpful if the Parent task requires different efforts to be \
            accomplished in parallel or sequence.

            Example of Sub-Task:
            Certificate: Request SSL Certificate for the UI URL
            IDP Integration: Develop Integration to OKTA using OIDC
            """;

    @SuppressWarnings("unchecked")
    public String analyzeRequirements(UUID projectId) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Anthropic API key is not configured");
        }

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

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "max_tokens", maxTokens,
                    "system", SYSTEM_PROMPT,
                    "messages", List.of(
                            Map.of("role", "user", "content", combinedText)
                    )
            );

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            log.debug("Request body length: {} chars", jsonBody.length());

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
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
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
}
