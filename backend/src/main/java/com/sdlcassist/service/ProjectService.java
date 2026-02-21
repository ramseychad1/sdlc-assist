package com.sdlcassist.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdlcassist.dto.ProjectRequest;
import com.sdlcassist.dto.TechPreferencesRequest;
import com.sdlcassist.model.Project;
import com.sdlcassist.model.User;
import com.sdlcassist.repository.ProjectRepository;
import com.sdlcassist.repository.ProjectScreenRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectScreenRepository screenRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<Project> findAll() {
        return projectRepository.findAllByOrderByUpdatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Project> findByOwner(UUID ownerId) {
        return projectRepository.findByOwnerIdOrderByUpdatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public Project findById(UUID id) {
        return projectRepository.findByIdWithOwner(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + id));
    }

    @Transactional
    public Project create(ProjectRequest request, User owner) {
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(Project.Status.DRAFT)
                .owner(owner)
                .build();
        return projectRepository.save(project);
    }

    @Transactional
    public Project update(UUID id, ProjectRequest request) {
        Project project = findById(id);
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        return projectRepository.save(project);
    }

    @Transactional
    public Project savePrd(UUID id, String content) {
        Project project = findById(id);
        project.setPrdContent(content);
        return projectRepository.save(project);
    }

    @Transactional
    public Project saveDesignSystem(UUID id, String content) {
        Project project = findById(id);
        project.setDesignSystemContent(content);
        project.setDesignSystemUpdatedAt(Instant.now());
        return projectRepository.save(project);
    }

    @Transactional
    public Project selectTemplate(UUID id, String templateId) {
        Project project = findById(id);
        project.setSelectedTemplateId(templateId);
        return projectRepository.save(project);
    }

    @Transactional
    public Project completePhase(UUID projectId, String phase) {
        Project project = findById(projectId);
        if ("UX_DESIGN".equals(phase)) {
            long generatedCount = screenRepository.countByProjectIdAndPrototypeContentIsNotNull(projectId);
            if (generatedCount == 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "At least one screen prototype must be generated before completing UX Design.");
            }
            project.setUxDesignStatus("COMPLETE");
            project.setUxDesignCompletedAt(Instant.now());
            project.setTechnicalDesignStatus("UNLOCKED");
        } else if ("TECHNICAL_DESIGN".equals(phase)) {
            if (project.getArchOverviewContent() == null ||
                project.getDataModelContent() == null ||
                project.getApiContractContent() == null ||
                project.getSequenceDiagramsContent() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "All four technical design artifacts must be generated before completing Technical Design.");
            }
            project.setTechDesignStatus("COMPLETE");
            project.setTechDesignCompletedAt(Instant.now());
        }
        return projectRepository.save(project);
    }

    @Transactional
    public Project saveTechPreferences(UUID projectId, TechPreferencesRequest request) {
        Project project = findById(projectId);
        try {
            project.setTechPreferences(objectMapper.writeValueAsString(request));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize tech preferences");
        }
        project.setTechPreferencesSavedAt(Instant.now());
        return projectRepository.save(project);
    }

    @Transactional
    public Project saveCorporateGuidelines(UUID projectId, MultipartFile file) {
        Project project = findById(projectId);
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".md")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only .md files are accepted.");
        }
        if (file.getSize() > 512_000) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Maximum file size is 500KB.");
        }
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            project.setCorporateGuidelinesContent(content);
            project.setCorporateGuidelinesFilename(filename);
            project.setCorporateGuidelinesUploadedAt(Instant.now());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read file.");
        }
        return projectRepository.save(project);
    }

    @Transactional
    public Project deleteCorporateGuidelines(UUID projectId) {
        Project project = findById(projectId);
        project.setCorporateGuidelinesContent(null);
        project.setCorporateGuidelinesFilename(null);
        project.setCorporateGuidelinesUploadedAt(null);
        return projectRepository.save(project);
    }

    @Transactional
    public Project saveArtifact(UUID projectId, String artifactType, String content) {
        Project project = findById(projectId);
        Instant now = Instant.now();
        switch (artifactType) {
            case "architecture" -> { project.setArchOverviewContent(content); project.setArchOverviewGeneratedAt(now); }
            case "data-model"   -> { project.setDataModelContent(content);    project.setDataModelGeneratedAt(now); }
            case "api-contract" -> { project.setApiContractContent(content);  project.setApiContractGeneratedAt(now); }
            case "sequence-diagrams" -> { project.setSequenceDiagramsContent(content); project.setSequenceDiagramsGeneratedAt(now); }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown artifact type: " + artifactType);
        }
        if ("NOT_STARTED".equals(project.getTechDesignStatus())) {
            project.setTechDesignStatus("IN_PROGRESS");
        }
        return projectRepository.save(project);
    }

    @Transactional
    public Project clearArtifact(UUID projectId, String artifactType) {
        Project project = findById(projectId);
        switch (artifactType) {
            case "architecture"      -> { project.setArchOverviewContent(null);      project.setArchOverviewGeneratedAt(null); }
            case "data-model"        -> { project.setDataModelContent(null);         project.setDataModelGeneratedAt(null); }
            case "api-contract"      -> { project.setApiContractContent(null);       project.setApiContractGeneratedAt(null); }
            case "sequence-diagrams" -> { project.setSequenceDiagramsContent(null);  project.setSequenceDiagramsGeneratedAt(null); }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown artifact type: " + artifactType);
        }
        return projectRepository.save(project);
    }

    @Transactional
    public void delete(UUID id) {
        Project project = findById(id);
        projectRepository.delete(project);
    }
}
