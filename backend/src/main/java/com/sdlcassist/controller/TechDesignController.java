package com.sdlcassist.controller;

import com.sdlcassist.dto.ProjectResponse;
import com.sdlcassist.dto.TechDesignArtifactRequest;
import com.sdlcassist.model.Project;
import com.sdlcassist.service.ProjectService;
import com.sdlcassist.service.TechDesignService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class TechDesignController {

    private final TechDesignService techDesignService;
    private final ProjectService projectService;

    private final ExecutorService streamExecutor = Executors.newVirtualThreadPerTaskExecutor();

    // -------------------------------------------------------------------------
    // SSE generation endpoints (POST — GET would also work but POST is cleaner
    // for future real agent calls that send context in the request body)
    // -------------------------------------------------------------------------

    @PostMapping(value = "/{id}/tech-design/architecture/generate",
                 produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateArchitecture(
            @PathVariable UUID id, HttpServletResponse response) {
        return buildEmitter(response, emitter ->
                techDesignService.generateArchitecture(id, emitter));
    }

    @PostMapping(value = "/{id}/tech-design/data-model/generate",
                 produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateDataModel(
            @PathVariable UUID id, HttpServletResponse response) {
        return buildEmitter(response, emitter ->
                techDesignService.generateDataModel(id, emitter));
    }

    @PostMapping(value = "/{id}/tech-design/api-contract/generate",
                 produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateApiContract(
            @PathVariable UUID id, HttpServletResponse response) {
        return buildEmitter(response, emitter ->
                techDesignService.generateApiContract(id, emitter));
    }

    @PostMapping(value = "/{id}/tech-design/sequence-diagrams/generate",
                 produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateSequenceDiagrams(
            @PathVariable UUID id, HttpServletResponse response) {
        return buildEmitter(response, emitter ->
                techDesignService.generateSequenceDiagrams(id, emitter));
    }

    // -------------------------------------------------------------------------
    // PATCH endpoints — explicit save / edit after generation
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/tech-design/architecture")
    public ResponseEntity<ProjectResponse> saveArchitecture(
            @PathVariable UUID id, @RequestBody TechDesignArtifactRequest request) {
        Project project = projectService.saveArtifact(id, "architecture", request.getContent());
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @PatchMapping("/{id}/tech-design/data-model")
    public ResponseEntity<ProjectResponse> saveDataModel(
            @PathVariable UUID id, @RequestBody TechDesignArtifactRequest request) {
        Project project = projectService.saveArtifact(id, "data-model", request.getContent());
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @PatchMapping("/{id}/tech-design/api-contract")
    public ResponseEntity<ProjectResponse> saveApiContract(
            @PathVariable UUID id, @RequestBody TechDesignArtifactRequest request) {
        Project project = projectService.saveArtifact(id, "api-contract", request.getContent());
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @PatchMapping("/{id}/tech-design/sequence-diagrams")
    public ResponseEntity<ProjectResponse> saveSequenceDiagrams(
            @PathVariable UUID id, @RequestBody TechDesignArtifactRequest request) {
        Project project = projectService.saveArtifact(id, "sequence-diagrams", request.getContent());
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    // -------------------------------------------------------------------------
    // DELETE endpoints — regenerate (clear content, reset to "ready" state)
    // -------------------------------------------------------------------------

    @DeleteMapping("/{id}/tech-design/architecture")
    public ResponseEntity<ProjectResponse> clearArchitecture(@PathVariable UUID id) {
        Project project = projectService.clearArtifact(id, "architecture");
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @DeleteMapping("/{id}/tech-design/data-model")
    public ResponseEntity<ProjectResponse> clearDataModel(@PathVariable UUID id) {
        Project project = projectService.clearArtifact(id, "data-model");
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @DeleteMapping("/{id}/tech-design/api-contract")
    public ResponseEntity<ProjectResponse> clearApiContract(@PathVariable UUID id) {
        Project project = projectService.clearArtifact(id, "api-contract");
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @DeleteMapping("/{id}/tech-design/sequence-diagrams")
    public ResponseEntity<ProjectResponse> clearSequenceDiagrams(@PathVariable UUID id) {
        Project project = projectService.clearArtifact(id, "sequence-diagrams");
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    // -------------------------------------------------------------------------
    // SSE emitter builder — shared pattern
    // -------------------------------------------------------------------------

    private SseEmitter buildEmitter(HttpServletResponse response,
                                     java.util.function.Consumer<SseEmitter> task) {
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

        SseEmitter emitter = new SseEmitter(300_000L);

        emitter.onTimeout(() -> {
            try {
                emitter.send(SseEmitter.event().name("progress")
                        .data("{\"event\":\"ERROR\",\"message\":\"Agent timed out after 5 minutes\"}"));
            } catch (Exception ignored) {}
            emitter.complete();
        });

        emitter.onError(ex -> {
            try {
                emitter.send(SseEmitter.event().name("progress")
                        .data("{\"event\":\"ERROR\",\"message\":\"Stream error\"}"));
            } catch (Exception ignored) {}
            emitter.complete();
        });

        streamExecutor.execute(() -> task.accept(emitter));
        return emitter;
    }
}
