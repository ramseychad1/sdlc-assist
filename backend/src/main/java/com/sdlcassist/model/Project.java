package com.sdlcassist.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "prd_content", columnDefinition = "TEXT")
    private String prdContent;

    @Column(name = "selected_template_id", length = 100)
    private String selectedTemplateId;

    @Column(name = "design_system_content", columnDefinition = "TEXT")
    private String designSystemContent;

    @Column(name = "ux_design_status", length = 20)
    @Builder.Default
    private String uxDesignStatus = "NOT_STARTED";

    @Column(name = "technical_design_status", length = 20)
    @Builder.Default
    private String technicalDesignStatus = "LOCKED";

    @Column(name = "ux_design_completed_at")
    private Instant uxDesignCompletedAt;

    @Column(name = "design_system_updated_at")
    private Instant designSystemUpdatedAt;

    // --- Technical Design Phase ---

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tech_preferences", columnDefinition = "jsonb")
    private String techPreferences;

    @Column(name = "tech_preferences_saved_at")
    private Instant techPreferencesSavedAt;

    @Column(name = "corporate_guidelines_content", columnDefinition = "TEXT")
    private String corporateGuidelinesContent;

    @Column(name = "corporate_guidelines_filename", length = 255)
    private String corporateGuidelinesFilename;

    @Column(name = "corporate_guidelines_uploaded_at")
    private Instant corporateGuidelinesUploadedAt;

    @Column(name = "arch_overview_content", columnDefinition = "TEXT")
    private String archOverviewContent;

    @Column(name = "arch_overview_generated_at")
    private Instant archOverviewGeneratedAt;

    @Column(name = "data_model_content", columnDefinition = "TEXT")
    private String dataModelContent;

    @Column(name = "data_model_generated_at")
    private Instant dataModelGeneratedAt;

    @Column(name = "api_contract_content", columnDefinition = "TEXT")
    private String apiContractContent;

    @Column(name = "api_contract_generated_at")
    private Instant apiContractGeneratedAt;

    @Column(name = "sequence_diagrams_content", columnDefinition = "TEXT")
    private String sequenceDiagramsContent;

    @Column(name = "sequence_diagrams_generated_at")
    private Instant sequenceDiagramsGeneratedAt;

    @Column(name = "tech_design_status", length = 20)
    @Builder.Default
    private String techDesignStatus = "NOT_STARTED";

    @Column(name = "tech_design_completed_at")
    private Instant techDesignCompletedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private Status status = Status.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum Status {
        DRAFT, ACTIVE, COMPLETED, ARCHIVED
    }
}
