CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration INTERVAL,
  pause_duration INTERVAL,
  end_time TIMESTAMP WITH TIME ZONE,
  winner_team TEXT CHECK (winner_team IN ('A', 'B')),
  status TEXT CHECK (status IN ('planned', 'active', 'paused', 'finished')) NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);