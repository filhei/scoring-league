CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  list_name TEXT,
  elo INTEGER DEFAULT 1500,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) UNIQUE
);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Anonymous users can view all players (including inactive for historical data)
CREATE POLICY "Anonymous can view all players" ON players
  FOR SELECT TO anon
  USING (true);

-- Authenticated users can view all players (including inactive for historical data)
CREATE POLICY "Authenticated can view all players" ON players
  FOR SELECT TO authenticated
  USING (true);

-- Users can update their own player record (name, elo, is_active only)
-- Explicitly prevents id, created_at, user_id, and list_name changes
CREATE POLICY "Users can update their own record" ON players
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    -- Prevent changing id (must remain the same)
    id = (SELECT id FROM players WHERE user_id = auth.uid()) AND
    -- Prevent changing created_at (must remain the same)
    created_at = (SELECT created_at FROM players WHERE user_id = auth.uid()) AND
    -- Prevent changing user_id (handled by separate nullification policy)
    user_id = auth.uid() AND
    -- Prevent changing list_name (service role only)
    list_name = (SELECT list_name FROM players WHERE user_id = auth.uid())
  );

-- Users can nullify their own account
-- This allows setting everything except id and list_name to null
CREATE POLICY "Users can nullify their own account" ON players
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    -- Prevent changing id (must remain the same)
    id = (SELECT id FROM players WHERE user_id = auth.uid()) AND
    -- Prevent changing list_name (service role only)
    list_name = (SELECT list_name FROM players WHERE user_id = auth.uid()) AND
    -- Allow setting rest to null only
    (name IS NULL) AND
    (elo IS NULL) AND
    (is_active IS NULL) AND
    (created_at IS NULL) AND
    (user_id IS NULL)
  );

-- Only service role can create/delete players (admin operations)
CREATE POLICY "Service role can manage all players" ON players
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);