package com.sdlcassist.controller;

import com.sdlcassist.dto.CompletePhaseRequest;
import com.sdlcassist.dto.PrdRequest;
import com.sdlcassist.dto.ProjectRequest;
import com.sdlcassist.dto.ProjectResponse;
import com.sdlcassist.dto.TemplateSelectionRequest;
import com.sdlcassist.model.Project;
import com.sdlcassist.model.User;
import com.sdlcassist.service.ProjectService;
import com.sdlcassist.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAll() {
        List<ProjectResponse> projects = projectService.findAll().stream()
                .map(ProjectResponse::from)
                .toList();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getById(@PathVariable UUID id) {
        Project project = projectService.findById(id);
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectRequest request,
            Authentication authentication) {
        User owner = userService.findByUsername(authentication.getName())
                .orElseThrow();
        Project project = projectService.create(request, owner);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProjectResponse.from(project));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> update(@PathVariable UUID id,
            @Valid @RequestBody ProjectRequest request) {
        Project project = projectService.update(id, request);
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @PutMapping("/{id}/prd")
    public ResponseEntity<ProjectResponse> savePrd(@PathVariable UUID id,
            @RequestBody PrdRequest request) {
        Project project = projectService.savePrd(id, request.getContent());
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @PutMapping("/{id}/template")
    public ResponseEntity<ProjectResponse> selectTemplate(@PathVariable UUID id,
            @Valid @RequestBody TemplateSelectionRequest request) {
        Project project = projectService.selectTemplate(id, request.getTemplateId());
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @PostMapping("/{id}/complete-phase")
    public ResponseEntity<ProjectResponse> completePhase(
            @PathVariable UUID id, @RequestBody CompletePhaseRequest request) {
        Project project = projectService.completePhase(id, request.getPhase());
        return ResponseEntity.ok(ProjectResponse.from(project));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
