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