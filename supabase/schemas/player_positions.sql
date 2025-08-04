CREATE TABLE player_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  position TEXT CHECK (position IN ('Målvakt', 'Back', 'Center', 'Forward')) NOT NULL,
  preference TEXT CHECK (preference IN ('primary', 'secondary')) NOT NULL
);
