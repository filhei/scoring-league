CREATE TABLE player_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  position TEXT CHECK (position IN ('Målvakt', 'Back', 'Center', 'Forward')) NOT NULL,
  preference TEXT CHECK (preference IN ('primary', 'secondary')) NOT NULL
);

-- Enable RLS
ALTER TABLE player_positions ENABLE ROW LEVEL SECURITY;

-- Anonymous users can view all player positions
CREATE POLICY "Anonymous can view player positions" ON player_positions
  FOR SELECT TO anon
  USING (true);

-- Authenticated users can view all player positions
CREATE POLICY "Authenticated can view player positions" ON player_positions
  FOR SELECT TO authenticated
  USING (true);

-- Users can only manage their own position preferences
CREATE POLICY "Users can manage their own positions" ON player_positions
  FOR ALL TO authenticated
  USING (
    player_id IN (
      SELECT id FROM players 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    player_id IN (
      SELECT id FROM players 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Only service role can manage other users' positions
CREATE POLICY "Service role can manage all positions" ON player_positions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
