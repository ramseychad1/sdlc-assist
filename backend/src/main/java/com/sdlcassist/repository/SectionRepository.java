package com.sdlcassist.repository;

import com.sdlcassist.model.RequirementSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SectionRepository extends JpaRepository<RequirementSection, UUID> {
    List<RequirementSection> findByProjectIdOrderBySortOrderAsc(UUID projectId);

    boolean existsByProjectId(UUID projectId);
}
