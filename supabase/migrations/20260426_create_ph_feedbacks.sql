-- User feedback table (bugs & suggestions)
CREATE TABLE IF NOT EXISTS ph_feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion')),
  message TEXT NOT NULL,
  contact_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'done', 'dismissed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ph_feedbacks_status ON ph_feedbacks (status);
CREATE INDEX IF NOT EXISTS idx_ph_feedbacks_created ON ph_feedbacks (created_at DESC);

ALTER TABLE ph_feedbacks ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can submit feedback
CREATE POLICY "ph_feedbacks_insert" ON ph_feedbacks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can read their own feedback
CREATE POLICY "ph_feedbacks_select_own" ON ph_feedbacks
  FOR SELECT USING (auth.uid() = user_id);

-- Admin (tomicharles@gmail.com) can read all and update
CREATE POLICY "ph_feedbacks_admin_select" ON ph_feedbacks
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'tomicharles@gmail.com'
  );

CREATE POLICY "ph_feedbacks_admin_update" ON ph_feedbacks
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'tomicharles@gmail.com'
  );
