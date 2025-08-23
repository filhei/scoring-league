CREATE TABLE match_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team TEXT CHECK (team IN ('A', 'B')) NOT NULL,
  is_goalkeeper BOOLEAN DEFAULT false
);

CREATE UNIQUE INDEX match_players_one_goalkeeper_per_team 
ON match_players (match_id, team) 
WHERE is_goalkeeper = true;

-- Enable RLS
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

-- Anonymous users can view match players for all matches
CREATE POLICY "Anonymous can view match players" ON match_players
  FOR SELECT TO anon
  USING (true);

-- Authenticated users can view match players for all matches
CREATE POLICY "Authenticated can view match players" ON match_players
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can manage match players for active, paused, and planned matches
CREATE POLICY "Authenticated can manage match players for non-finished matches" ON match_players
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = match_players.match_id 
      AND matches.match_status IN ('active', 'paused', 'planned')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = match_players.match_id 
      AND matches.match_status IN ('active', 'paused', 'planned')
    )
  );

-- Only service role can manage match players for finished matches
CREATE POLICY "Service role can manage match players for finished matches" ON match_players
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);