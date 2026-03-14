-- Make bulletin metadata fields optional (all fields optional, at least one file required)
ALTER TABLE podcasts ALTER COLUMN title DROP NOT NULL;
ALTER TABLE podcasts ALTER COLUMN domain DROP NOT NULL;
ALTER TABLE podcasts ALTER COLUMN year DROP NOT NULL;
ALTER TABLE podcasts ALTER COLUMN content_type DROP NOT NULL;

-- Re-add CHECK constraints to allow NULL values
ALTER TABLE podcasts DROP CONSTRAINT IF EXISTS podcasts_domain_check;
ALTER TABLE podcasts ADD CONSTRAINT podcasts_domain_check
  CHECK (domain IS NULL OR domain IN ('AMG', 'ARG', 'QRMG', 'AITG', 'LEAP', 'Independence'));

ALTER TABLE podcasts DROP CONSTRAINT IF EXISTS podcasts_content_type_check;
ALTER TABLE podcasts ADD CONSTRAINT podcasts_content_type_check
  CHECK (content_type IS NULL OR content_type IN ('technical', 'learning_series'));
