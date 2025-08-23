CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  scoring_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  assisting_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team TEXT CHECK (team IN ('A', 'B')) NOT NULL,
  score_time INTERVAL NOT NULL
);

-- Enable RLS
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Anonymous users can view scores for all matches
CREATE POLICY "Anonymous can view scores" ON scores
  FOR SELECT TO anon
  USING (true);

-- Authenticated users can view scores for all matches
CREATE POLICY "Authenticated can view scores" ON scores
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can manage scores for active, paused, and planned matches
CREATE POLICY "Authenticated can manage scores for non-finished matches" ON scores
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = scores.match_id 
      AND matches.match_status IN ('active', 'paused', 'planned')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = scores.match_id 
      AND matches.match_status IN ('active', 'paused', 'planned')
    )
  );

-- Only service role can manage scores for finished matches
CREATE POLICY "Service role can manage scores for finished matches" ON scores
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);