package com.sdlcassist.service;

import com.sdlcassist.dto.ProjectRequest;
import com.sdlcassist.model.Project;
import com.sdlcassist.model.User;
import com.sdlcassist.repository.ProjectRepository;
import com.sdlcassist.repository.ProjectScreenRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectScreenRepository screenRepository;

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
        long generatedCount = screenRepository.countByProjectIdAndPrototypeContentIsNotNull(projectId);
        if (generatedCount == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "At least one screen prototype must be generated before completing UX Design.");
        }
        if ("UX_DESIGN".equals(phase)) {
            project.setUxDesignStatus("COMPLETE");
            project.setUxDesignCompletedAt(Instant.now());
            project.setTechnicalDesignStatus("UNLOCKED");
        }
        return projectRepository.save(project);
    }

    @Transactional
    public void delete(UUID id) {
        Project project = findById(id);
        projectRepository.delete(project);
    }
}
