package com.sdlcassist.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
