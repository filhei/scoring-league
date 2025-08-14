alter table "public"."match_players" add column "is_goalkeeper" boolean default false;

CREATE UNIQUE INDEX match_players_one_goalkeeper_per_team ON public.match_players USING btree (match_id, team) WHERE (is_goalkeeper = true);


