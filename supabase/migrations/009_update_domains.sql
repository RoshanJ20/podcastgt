-- Migration: Update domain values from short codes to full names
-- and restructure domain categories for technical releases vs learning series.

-- Step 1: Drop old check constraints
ALTER TABLE podcasts DROP CONSTRAINT IF EXISTS podcasts_domain_check;
ALTER TABLE learning_graphs DROP CONSTRAINT IF EXISTS learning_graphs_domain_check;

-- Step 2: Migrate existing domain values to new names
UPDATE podcasts SET domain = 'Audit Methodology' WHERE domain = 'AMG';
UPDATE podcasts SET domain = 'Accounting and Reporting' WHERE domain = 'ARG';
UPDATE podcasts SET domain = 'Quality and Risk' WHERE domain = 'QRMG';
UPDATE podcasts SET domain = 'Audit Technology' WHERE domain = 'AITG';
-- LEAP stays the same
UPDATE podcasts SET domain = 'Auditing' WHERE domain = 'Independence';

UPDATE learning_graphs SET domain = 'Audit Methodology' WHERE domain = 'AMG';
UPDATE learning_graphs SET domain = 'Accounting and Reporting' WHERE domain = 'ARG';
UPDATE learning_graphs SET domain = 'Quality and Risk' WHERE domain = 'QRMG';
UPDATE learning_graphs SET domain = 'Audit Technology' WHERE domain = 'AITG';
-- LEAP stays the same
UPDATE learning_graphs SET domain = 'Auditing' WHERE domain = 'Independence';

-- Step 3: Add new check constraints with updated domain values
ALTER TABLE podcasts ADD CONSTRAINT podcasts_domain_check
  CHECK (domain IN ('Audit Methodology', 'Accounting and Reporting', 'Audit Technology', 'Quality and Risk', 'LEAP', 'Auditing'));

ALTER TABLE learning_graphs ADD CONSTRAINT learning_graphs_domain_check
  CHECK (domain IN ('Audit Methodology', 'Accounting and Reporting', 'Audit Technology', 'Quality and Risk', 'LEAP', 'Auditing'));
