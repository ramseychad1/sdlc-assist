package com.sdlcassist.dto;

import com.sdlcassist.model.Project;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProjectResponse {
    private UUID id;
    private String name;
    private String description;
    private String prdContent;
    private String selectedTemplateId;
    private String designSystemContent;
    private String status;
    private String uxDesignStatus;
    private String technicalDesignStatus;
    private Instant uxDesignCompletedAt;
    private Instant designSystemUpdatedAt;

    // Technical Design Phase
    private String techPreferences;
    private Instant techPreferencesSavedAt;
    private String corporateGuidelinesFilename;
    private Instant corporateGuidelinesUploadedAt;
    private String archOverviewContent;
    private Instant archOverviewGeneratedAt;
    private String dataModelContent;
    private Instant dataModelGeneratedAt;
    private String apiContractContent;
    private Instant apiContractGeneratedAt;
    private String sequenceDiagramsContent;
    private Instant sequenceDiagramsGeneratedAt;
    private String techDesignStatus;
    private Instant techDesignCompletedAt;

    private String ownerName;
    private UUID ownerId;
    private Instant createdAt;
    private Instant updatedAt;

    public static ProjectResponse from(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .prdContent(project.getPrdContent())
                .selectedTemplateId(project.getSelectedTemplateId())
                .designSystemContent(project.getDesignSystemContent())
                .status(project.getStatus().name())
                .uxDesignStatus(project.getUxDesignStatus())
                .technicalDesignStatus(project.getTechnicalDesignStatus())
                .uxDesignCompletedAt(project.getUxDesignCompletedAt())
                .designSystemUpdatedAt(project.getDesignSystemUpdatedAt())
                .techPreferences(project.getTechPreferences())
                .techPreferencesSavedAt(project.getTechPreferencesSavedAt())
                .corporateGuidelinesFilename(project.getCorporateGuidelinesFilename())
                .corporateGuidelinesUploadedAt(project.getCorporateGuidelinesUploadedAt())
                .archOverviewContent(project.getArchOverviewContent())
                .archOverviewGeneratedAt(project.getArchOverviewGeneratedAt())
                .dataModelContent(project.getDataModelContent())
                .dataModelGeneratedAt(project.getDataModelGeneratedAt())
                .apiContractContent(project.getApiContractContent())
                .apiContractGeneratedAt(project.getApiContractGeneratedAt())
                .sequenceDiagramsContent(project.getSequenceDiagramsContent())
                .sequenceDiagramsGeneratedAt(project.getSequenceDiagramsGeneratedAt())
                .techDesignStatus(project.getTechDesignStatus())
                .techDesignCompletedAt(project.getTechDesignCompletedAt())
                .ownerName(project.getOwner() != null ? project.getOwner().getDisplayName() : null)
                .ownerId(project.getOwner() != null ? project.getOwner().getId() : null)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
