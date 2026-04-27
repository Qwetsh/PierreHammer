-- Flag to identify PierreHammer users (shared profiles table across apps)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ph_registered boolean NOT NULL DEFAULT false;

-- Mark existing PierreHammer users (have collection items or army lists)
UPDATE profiles SET ph_registered = true
WHERE id IN (
  SELECT DISTINCT user_id FROM ph_collection_items
  UNION
  SELECT DISTINCT user_id FROM army_lists
);

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_ph_registered ON profiles (ph_registered) WHERE ph_registered = true;

-- RPC: search only PierreHammer users
CREATE OR REPLACE FUNCTION search_ph_users(p_query text, p_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.id, p.username, p.display_name, p.created_at
  FROM profiles p
  WHERE p.ph_registered = true
    AND (
      p.username ILIKE '%' || p_query || '%'
      OR p.display_name ILIKE '%' || p_query || '%'
    )
  LIMIT p_limit;
$$;
