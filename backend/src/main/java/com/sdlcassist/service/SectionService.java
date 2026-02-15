package com.sdlcassist.service;

import com.sdlcassist.model.Project;
import com.sdlcassist.model.RequirementSection;
import com.sdlcassist.repository.SectionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SectionService {

    private final SectionRepository sectionRepository;
    private final ProjectService projectService;

    private static final List<SectionTemplate> DEFAULT_SECTIONS = List.of(
            new SectionTemplate("project_description", "Project Description", 0),
            new SectionTemplate("functional_requirements", "Functional Requirements", 1),
            new SectionTemplate("non_functional_requirements", "Non-Functional Requirements", 2),
            new SectionTemplate("user_stories", "User Stories", 3),
            new SectionTemplate("acceptance_criteria", "Acceptance Criteria", 4));

    @Transactional
    public List<RequirementSection> findByProjectId(UUID projectId) {
        Project project = projectService.findById(projectId);

        // Auto-create default sections if none exist
        if (!sectionRepository.existsByProjectId(projectId)) {
            DEFAULT_SECTIONS.forEach(template -> {
                RequirementSection section = RequirementSection.builder()
                        .project(project)
                        .sectionType(template.type())
                        .title(template.title())
                        .content("")
                        .sortOrder(template.sortOrder())
                        .build();
                sectionRepository.save(section);
            });
        }

        return sectionRepository.findByProjectIdOrderBySortOrderAsc(projectId);
    }

    public RequirementSection findById(UUID id) {
        return sectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Section not found: " + id));
    }

    @Transactional
    public RequirementSection updateContent(UUID sectionId, String content) {
        RequirementSection section = findById(sectionId);
        section.setContent(content);
        return sectionRepository.save(section);
    }

    private record SectionTemplate(String type, String title, int sortOrder) {
    }
}
