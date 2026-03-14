-- Support short and long form transcripts per bulletin
ALTER TABLE transcripts ADD COLUMN transcript_type TEXT NOT NULL DEFAULT 'short'
  CHECK (transcript_type IN ('short', 'long'));

-- Replace single-podcast unique constraint with compound unique
ALTER TABLE transcripts DROP CONSTRAINT IF EXISTS transcripts_podcast_id_key;
ALTER TABLE transcripts ADD CONSTRAINT transcripts_podcast_id_type_key
  UNIQUE (podcast_id, transcript_type);
