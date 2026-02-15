package com.sdlcassist.repository;

import com.sdlcassist.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.owner ORDER BY p.updatedAt DESC")
    List<Project> findAllByOrderByUpdatedAtDesc();

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.owner WHERE p.owner.id = :ownerId ORDER BY p.updatedAt DESC")
    List<Project> findByOwnerIdOrderByUpdatedAtDesc(UUID ownerId);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.owner WHERE p.id = :id")
    Optional<Project> findByIdWithOwner(UUID id);
}
