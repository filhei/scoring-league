CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  scoring_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  assisting_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team TEXT CHECK (team IN ('A', 'B')) NOT NULL,
  scored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);