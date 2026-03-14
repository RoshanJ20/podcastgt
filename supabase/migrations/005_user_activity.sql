-- =========================================================
-- USER ACTIVITY: track listening and engagement events
-- =========================================================
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('listen', 'bookmark', 'complete_node', 'view_path')),
  podcast_id UUID REFERENCES podcasts(id) ON DELETE SET NULL,
  graph_id UUID REFERENCES learning_graphs(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_activity_user_id_idx ON user_activity (user_id);
CREATE INDEX IF NOT EXISTS user_activity_created_at_idx ON user_activity (created_at);
CREATE INDEX IF NOT EXISTS user_activity_type_idx ON user_activity (activity_type);

-- RLS: users see only their own activity
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_activity_own_read" ON user_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_activity_own_insert" ON user_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);
