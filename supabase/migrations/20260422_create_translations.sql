-- Community translations table
-- Stores user-contributed translations for game data terms
-- The english_key is the original English text (used as lookup key)
-- category helps organize and filter translations by type

CREATE TABLE IF NOT EXISTS translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('unit', 'weapon', 'ability', 'stratagem', 'enhancement', 'detachment', 'faction', 'keyword', 'other')),
  english_key TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE (category, english_key)
);

-- Index for fast lookups by category
CREATE INDEX IF NOT EXISTS idx_translations_category ON translations (category);

-- Index for fast lookups by english key
CREATE INDEX IF NOT EXISTS idx_translations_english_key ON translations (english_key);

-- Enable RLS
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Anyone can read translations (even unauthenticated, for offline cache)
CREATE POLICY "translations_select" ON translations
  FOR SELECT USING (true);

-- Authenticated users can insert new translations
CREATE POLICY "translations_insert" ON translations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update existing translations
CREATE POLICY "translations_update" ON translations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_translations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION update_translations_timestamp();
