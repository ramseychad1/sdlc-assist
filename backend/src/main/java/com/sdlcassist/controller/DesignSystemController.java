package com.sdlcassist.controller;

import com.sdlcassist.dto.DesignSystemSaveRequest;
import com.sdlcassist.dto.ProjectResponse;
import com.sdlcassist.model.Project;
import com.sdlcassist.service.DesignSystemService;
import com.sdlcassist.service.ProjectService;
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
public class DesignSystemController {

    private final DesignSystemService designSystemService;
    private final ProjectService projectService;

    private final ExecutorService streamExecutor = Executors.newVirtualThreadPerTaskExecutor();

    @GetMapping(value = "/{id}/design-system/generate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateDesignSystem(
            @PathVariable UUID id,
            HttpServletResponse response) {

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

        streamExecutor.execute(() ->
                designSystemService.generateDesignSystem(id, emitter));

        return emitter;
    }

    @PutMapping("/{id}/design-system")
    public ResponseEntity<ProjectResponse> saveDesignSystem(
            @PathVariable UUID id,
            @RequestBody DesignSystemSaveRequest request) {
        Project project = projectService.saveDesignSystem(id, request.getContent());
        return ResponseEntity.ok(ProjectResponse.from(project));
    }
}
