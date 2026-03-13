-- Enable pgvector extension for AI search
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================
-- PLAYLISTS (must come before podcasts due to FK reference)
-- =========================================================
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL CHECK (domain IN ('AMG', 'ARG', 'QRMG', 'AITG', 'LEAP', 'Independence')),
  year INTEGER NOT NULL,
  thumbnail_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- PODCASTS
-- =========================================================
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL CHECK (domain IN ('AMG', 'ARG', 'QRMG', 'AITG', 'LEAP', 'Independence')),
  year INTEGER NOT NULL,
  tags TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  audio_short_url TEXT,
  audio_long_url TEXT,
  bulletin_url TEXT,
  content_type TEXT NOT NULL DEFAULT 'technical' CHECK (content_type IN ('technical', 'learning_series')),
  playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
  episode_order INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- TRANSCRIPTS (with vector embedding for AI search)
-- =========================================================
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  full_text TEXT,
  segments JSONB,  -- Array of {start: number, end: number, text: string}
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (podcast_id)
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS transcripts_embedding_idx
  ON transcripts USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- =========================================================
-- USER ROLES (Public / Admin / Superadmin)
-- =========================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('public', 'admin', 'superadmin')),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- =========================================================
-- BOOKMARKS
-- =========================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  timestamp_seconds FLOAT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks (user_id);
CREATE INDEX IF NOT EXISTS bookmarks_podcast_id_idx ON bookmarks (podcast_id);

-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER podcasts_updated_at
  BEFORE UPDATE ON podcasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =========================================================
-- HELPER FUNCTION: get current user role
-- =========================================================
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = uid LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

-- Podcasts: public read, admin/superadmin write
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "podcasts_public_read" ON podcasts FOR SELECT USING (true);
CREATE POLICY "podcasts_admin_insert" ON podcasts FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'superadmin'));
CREATE POLICY "podcasts_admin_update" ON podcasts FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));
CREATE POLICY "podcasts_admin_delete" ON podcasts FOR DELETE
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Playlists: public read, admin/superadmin write
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playlists_public_read" ON playlists FOR SELECT USING (true);
CREATE POLICY "playlists_admin_insert" ON playlists FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'superadmin'));
CREATE POLICY "playlists_admin_update" ON playlists FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));
CREATE POLICY "playlists_admin_delete" ON playlists FOR DELETE
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Transcripts: public read, admin/superadmin write
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transcripts_public_read" ON transcripts FOR SELECT USING (true);
CREATE POLICY "transcripts_admin_write" ON transcripts FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'superadmin'));
CREATE POLICY "transcripts_admin_update" ON transcripts FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));
CREATE POLICY "transcripts_admin_delete" ON transcripts FOR DELETE
  USING (get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Bookmarks: users see/manage only their own
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_own_read" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_own_insert" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_own_update" ON bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_own_delete" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- User roles: superadmin manages all, users read own
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_read_own" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_superadmin_read" ON user_roles FOR SELECT
  USING (get_user_role(auth.uid()) = 'superadmin');
CREATE POLICY "user_roles_superadmin_insert" ON user_roles FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'superadmin');
CREATE POLICY "user_roles_superadmin_update" ON user_roles FOR UPDATE
  USING (get_user_role(auth.uid()) = 'superadmin');
CREATE POLICY "user_roles_superadmin_delete" ON user_roles FOR DELETE
  USING (get_user_role(auth.uid()) = 'superadmin');

-- =========================================================
-- RPC: Match transcripts by vector similarity (AI search)
-- =========================================================
CREATE OR REPLACE FUNCTION match_transcripts(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  podcast_id UUID,
  full_text TEXT,
  segments JSONB,
  similarity FLOAT
)
LANGUAGE SQL STABLE AS $$
  SELECT
    t.podcast_id,
    t.full_text,
    t.segments,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM transcripts t
  WHERE t.embedding IS NOT NULL
    AND 1 - (t.embedding <=> query_embedding) > match_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
$$;
