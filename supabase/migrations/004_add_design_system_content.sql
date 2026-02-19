-- Phase 2.2: Add design_system_content column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS design_system_content TEXT;
