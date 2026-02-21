-- Phase 3.1: Technical Design phase columns
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS tech_preferences JSONB,
  ADD COLUMN IF NOT EXISTS tech_preferences_saved_at TIMESTAMP,

  ADD COLUMN IF NOT EXISTS corporate_guidelines_content TEXT,
  ADD COLUMN IF NOT EXISTS corporate_guidelines_filename VARCHAR(255),
  ADD COLUMN IF NOT EXISTS corporate_guidelines_uploaded_at TIMESTAMP,

  ADD COLUMN IF NOT EXISTS arch_overview_content TEXT,
  ADD COLUMN IF NOT EXISTS arch_overview_generated_at TIMESTAMP,

  ADD COLUMN IF NOT EXISTS data_model_content TEXT,
  ADD COLUMN IF NOT EXISTS data_model_generated_at TIMESTAMP,

  ADD COLUMN IF NOT EXISTS api_contract_content TEXT,
  ADD COLUMN IF NOT EXISTS api_contract_generated_at TIMESTAMP,

  ADD COLUMN IF NOT EXISTS sequence_diagrams_content TEXT,
  ADD COLUMN IF NOT EXISTS sequence_diagrams_generated_at TIMESTAMP,

  ADD COLUMN IF NOT EXISTS tech_design_status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS tech_design_completed_at TIMESTAMP;

-- tech_design_status values: NOT_STARTED, IN_PROGRESS, COMPLETE
-- tech_preferences JSONB shape: { frontend, backend, database, deployment, auth, apiStyle }
