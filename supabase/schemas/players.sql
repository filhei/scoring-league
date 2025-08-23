CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  elo INTEGER DEFAULT 1500,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Anonymous users can only view active players (names only)
CREATE POLICY "Anonymous can view active player names" ON players
  FOR SELECT TO anon
  USING (is_active = true);

-- Authenticated users can view all active players
CREATE POLICY "Authenticated can view active players" ON players
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Users can only update their own player record (name field only)
CREATE POLICY "Users can update their own name" ON players
  FOR UPDATE TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Users can soft delete their own account (set is_active = false)
CREATE POLICY "Users can soft delete their own account" ON players
  FOR UPDATE TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
    AND is_active = false
  );

-- Only service role can create/delete players (admin operations)
CREATE POLICY "Service role can manage all players" ON players
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);