-- Add pending/declined status to game_sessions for invitation flow
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_status_check;
ALTER TABLE game_sessions ADD CONSTRAINT game_sessions_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'abandoned', 'declined'));

-- Update default status to pending
ALTER TABLE game_sessions ALTER COLUMN status SET DEFAULT 'pending';

-- Index for pending sessions (invitation lookups)
CREATE INDEX IF NOT EXISTS idx_game_sessions_pending
  ON game_sessions(player2_id) WHERE status = 'pending';

-- Enable realtime on game_sessions for invitation notifications
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
