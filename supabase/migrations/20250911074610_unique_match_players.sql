CREATE UNIQUE INDEX match_players_unique_player_per_match ON public.match_players USING btree (match_id, player_id);


