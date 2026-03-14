-- Support multiple PDF uploads per bulletin
ALTER TABLE podcasts ADD COLUMN bulletin_urls JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data from single bulletin_url to bulletin_urls array
UPDATE podcasts
  SET bulletin_urls = jsonb_build_array(bulletin_url)
  WHERE bulletin_url IS NOT NULL;

-- Drop the old single-value column
ALTER TABLE podcasts DROP COLUMN bulletin_url;
