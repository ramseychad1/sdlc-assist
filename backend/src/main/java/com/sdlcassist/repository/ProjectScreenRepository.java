package com.sdlcassist.repository;

import com.sdlcassist.model.ProjectScreen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectScreenRepository extends JpaRepository<ProjectScreen, UUID> {

    List<ProjectScreen> findByProjectIdOrderByDisplayOrderAsc(UUID projectId);

    @Transactional
    void deleteByProjectId(UUID projectId);
}
