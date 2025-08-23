CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration INTERVAL,
  pause_duration INTERVAL,
  end_time TIMESTAMP WITH TIME ZONE,
  winner_team TEXT CHECK (winner_team IN ('A', 'B')),
  match_status TEXT CHECK (match_status IN ('planned', 'active', 'paused', 'finished')) NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  team_with_vests TEXT CHECK (team_with_vests IN ('A', 'B')) NULL
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Anonymous users can view all matches (read-only)
CREATE POLICY "Anonymous can view all matches" ON matches
  FOR SELECT TO anon
  USING (true);

-- Authenticated users can view all matches
CREATE POLICY "Authenticated can view all matches" ON matches
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can create matches
CREATE POLICY "Authenticated can create matches" ON matches
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can update active, paused, and planned matches
CREATE POLICY "Authenticated can update non-finished matches" ON matches
  FOR UPDATE TO authenticated
  USING (match_status IN ('active', 'paused', 'planned'))
  WITH CHECK (match_status IN ('active', 'paused', 'planned'));

-- Authenticated users can delete active, paused, and planned matches
CREATE POLICY "Authenticated can delete non-finished matches" ON matches
  FOR DELETE TO authenticated
  USING (match_status IN ('active', 'paused', 'planned'));

-- Only service role can manage finished matches
CREATE POLICY "Service role can manage finished matches" ON matches
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);