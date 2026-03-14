-- =========================================================
-- EPISODES: replace learning_graph_nodes with self-contained
-- episode records that carry their own content (audio, transcript)
-- alongside layout info (position, sort_order, node_type).
-- =========================================================

-- 1. Drop old edge/node tables (edges first to satisfy FK constraints)
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS learning_graph_edges;
DROP TABLE IF EXISTS learning_graph_nodes;

-- 2. Create episodes table
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_id UUID NOT NULL REFERENCES learning_graphs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  audio_url TEXT,
  transcript JSONB,  -- { full_text: string, segments: [{ start, end, text }] }
  sort_order INT DEFAULT 0,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  node_type TEXT DEFAULT 'default' CHECK (node_type IN ('default','start','milestone','end')),
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX episodes_graph_id_idx ON episodes(graph_id);

CREATE TRIGGER episodes_updated_at
  BEFORE UPDATE ON episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 3. Create learning_path_edges table
CREATE TABLE learning_path_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_id UUID NOT NULL REFERENCES learning_graphs(id) ON DELETE CASCADE,
  source_episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  target_episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (graph_id, source_episode_id, target_episode_id)
);

CREATE INDEX learning_path_edges_graph_id_idx ON learning_path_edges(graph_id);

-- 4. Recreate user_progress with episode_id
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  graph_id UUID NOT NULL REFERENCES learning_graphs(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, episode_id)
);

CREATE INDEX user_progress_user_id_idx ON user_progress(user_id);
CREATE INDEX user_progress_graph_id_idx ON user_progress(graph_id);

-- 5. Update user_activity: add episode_id, drop podcast_id reference
ALTER TABLE user_activity ADD COLUMN episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL;
ALTER TABLE user_activity DROP COLUMN IF EXISTS podcast_id;
ALTER TABLE user_activity DROP CONSTRAINT IF EXISTS user_activity_activity_type_check;
UPDATE user_activity SET activity_type = 'complete_episode'
  WHERE activity_type NOT IN ('listen', 'bookmark', 'complete_episode', 'view_path');
ALTER TABLE user_activity ADD CONSTRAINT user_activity_activity_type_check
  CHECK (activity_type IN ('listen', 'bookmark', 'complete_episode', 'view_path'));

-- 6. RLS for episodes
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view episodes of published graphs"
  ON episodes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM learning_graphs WHERE id = graph_id AND is_published = true
  ));

CREATE POLICY "Admins can manage episodes"
  ON episodes FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- 7. RLS for learning_path_edges
ALTER TABLE learning_path_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view edges of published graphs"
  ON learning_path_edges FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM learning_graphs WHERE id = graph_id AND is_published = true
  ));

CREATE POLICY "Admins can manage path edges"
  ON learning_path_edges FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- 8. RLS for user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_progress_own_read" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_progress_own_insert" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_own_delete" ON user_progress
  FOR DELETE USING (auth.uid() = user_id);
