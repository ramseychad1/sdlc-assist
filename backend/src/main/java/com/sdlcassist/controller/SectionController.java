package com.sdlcassist.controller;

import com.sdlcassist.dto.SectionRequest;
import com.sdlcassist.dto.SectionResponse;
import com.sdlcassist.model.RequirementSection;
import com.sdlcassist.service.SectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;

    @GetMapping
    public ResponseEntity<List<SectionResponse>> getByProject(@PathVariable UUID projectId) {
        List<SectionResponse> sections = sectionService.findByProjectId(projectId).stream()
                .map(SectionResponse::from)
                .toList();
        return ResponseEntity.ok(sections);
    }

    @PutMapping("/{sectionId}")
    public ResponseEntity<SectionResponse> update(@PathVariable UUID projectId,
            @PathVariable UUID sectionId,
            @Valid @RequestBody SectionRequest request) {
        RequirementSection section = sectionService.updateContent(sectionId, request.getContent());
        return ResponseEntity.ok(SectionResponse.from(section));
    }
}
