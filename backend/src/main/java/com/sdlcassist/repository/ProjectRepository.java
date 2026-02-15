package com.sdlcassist.repository;

import com.sdlcassist.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findAllByOrderByUpdatedAtDesc();

    List<Project> findByOwnerIdOrderByUpdatedAtDesc(UUID ownerId);
}
