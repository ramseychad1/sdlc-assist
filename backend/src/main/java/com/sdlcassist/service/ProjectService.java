package com.sdlcassist.service;

import com.sdlcassist.dto.ProjectRequest;
import com.sdlcassist.model.Project;
import com.sdlcassist.model.User;
import com.sdlcassist.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

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
    public void delete(UUID id) {
        Project project = findById(id);
        projectRepository.delete(project);
    }
}
