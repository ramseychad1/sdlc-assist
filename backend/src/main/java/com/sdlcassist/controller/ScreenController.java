package com.sdlcassist.controller;

import com.sdlcassist.dto.PrototypeRefineRequest;
import com.sdlcassist.dto.PrototypeSaveRequest;
import com.sdlcassist.dto.ScreenDefinitionDto;
import com.sdlcassist.service.ScreenExtractionService;
import com.sdlcassist.service.ScreenGenerationService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ScreenController {

    private final ScreenExtractionService screenExtractionService;
    private final ScreenGenerationService screenGenerationService;

    private final ExecutorService streamExecutor = Executors.newVirtualThreadPerTaskExecutor();

    @GetMapping("/{id}/screens")
    public ResponseEntity<List<ScreenDefinitionDto>> getScreens(@PathVariable UUID id) {
        return ResponseEntity.ok(screenExtractionService.getScreens(id));
    }

    @PostMapping("/{id}/screens")
    public ResponseEntity<List<ScreenDefinitionDto>> saveScreens(
            @PathVariable UUID id,
            @RequestBody List<ScreenDefinitionDto> screens) {
        return ResponseEntity.ok(screenExtractionService.saveScreens(id, screens));
    }

    @GetMapping(value = "/{id}/screens/extract", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter extractScreens(
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
                screenExtractionService.extractScreens(id, emitter));

        return emitter;
    }

    @GetMapping(value = "/{id}/screens/{screenId}/generate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generatePrototype(
            @PathVariable UUID id,
            @PathVariable UUID screenId,
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
                screenGenerationService.generatePrototype(id, screenId, emitter));

        return emitter;
    }

    @PutMapping("/{id}/screens/{screenId}/prototype")
    public ResponseEntity<ScreenDefinitionDto> savePrototype(
            @PathVariable UUID id,
            @PathVariable UUID screenId,
            @RequestBody PrototypeSaveRequest request) {
        return ResponseEntity.ok(screenGenerationService.savePrototype(id, screenId, request.getHtmlContent()));
    }

    @PatchMapping("/{id}/screens/{screenId}/prototype")
    public ResponseEntity<ScreenDefinitionDto> saveRefinedPrototype(
            @PathVariable UUID id,
            @PathVariable UUID screenId,
            @RequestBody PrototypeSaveRequest request) {
        // Accepts same body as PUT — prototypeContent or htmlContent
        String content = request.getHtmlContent();
        return ResponseEntity.ok(screenGenerationService.savePrototype(id, screenId, content));
    }

    @PostMapping(value = "/{id}/screens/{screenId}/refine", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter refinePrototype(
            @PathVariable UUID id,
            @PathVariable UUID screenId,
            @RequestBody PrototypeRefineRequest request,
            HttpServletResponse response) {

        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

        SseEmitter emitter = new SseEmitter(300_000L);

        emitter.onTimeout(() -> {
            try {
                emitter.send(SseEmitter.event().name("refine")
                        .data("{\"event\":\"ERROR\",\"message\":\"Agent timed out after 5 minutes\"}"));
            } catch (Exception ignored) {}
            emitter.complete();
        });

        emitter.onError(ex -> {
            try {
                emitter.send(SseEmitter.event().name("refine")
                        .data("{\"event\":\"ERROR\",\"message\":\"Stream error\"}"));
            } catch (Exception ignored) {}
            emitter.complete();
        });

        streamExecutor.execute(() ->
                screenGenerationService.refinePrototype(id, screenId, request.getMessage(), emitter));

        return emitter;
    }
}
