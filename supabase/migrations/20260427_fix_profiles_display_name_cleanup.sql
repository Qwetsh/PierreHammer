-- Add display_name column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;

-- Add backend validation for username (3-20 chars, alphanumeric + dash + underscore)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_valid;
ALTER TABLE profiles ADD CONSTRAINT profiles_username_valid
  CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_-]{3,20}$');

-- Drop orphan friendships table (all code uses ph_friendships)
DROP TABLE IF EXISTS friendships CASCADE;
