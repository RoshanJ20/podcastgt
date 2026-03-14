-- =========================================================
-- CLEANUP: drop unused playlists table and dead columns
-- from podcasts table
-- =========================================================

-- Drop unused columns from podcasts (FK constraint drops automatically with column)
ALTER TABLE podcasts DROP COLUMN IF EXISTS playlist_id;
ALTER TABLE podcasts DROP COLUMN IF EXISTS episode_order;

-- Drop the playlists table (completely unused in codebase)
DROP TABLE IF EXISTS playlists;
