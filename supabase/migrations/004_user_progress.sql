-- =========================================================
-- USER PROGRESS: track completed nodes in learning paths
-- =========================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  graph_id UUID NOT NULL REFERENCES learning_graphs(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES learning_graph_nodes(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, node_id)
);

CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress (user_id);
CREATE INDEX IF NOT EXISTS user_progress_graph_id_idx ON user_progress (graph_id);

-- RLS: users see/manage only their own progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_progress_own_read" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_progress_own_insert" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_own_delete" ON user_progress
  FOR DELETE USING (auth.uid() = user_id);
