create table "public"."match_players" (
    "id" uuid not null default gen_random_uuid(),
    "match_id" uuid,
    "player_id" uuid,
    "team" text not null
);


create table "public"."matches" (
    "id" uuid not null default gen_random_uuid(),
    "start_time" timestamp with time zone not null default now(),
    "end_time" timestamp with time zone,
    "winner_team" text,
    "status" text not null default 'planned'::text,
    "created_at" timestamp with time zone default now()
);


create table "public"."player_positions" (
    "id" uuid not null default gen_random_uuid(),
    "player_id" uuid,
    "position" text not null,
    "preference" text not null
);


create table "public"."players" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "name" text not null,
    "elo" integer default 1200,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
);


create table "public"."scores" (
    "id" uuid not null default gen_random_uuid(),
    "match_id" uuid,
    "scoring_player_id" uuid,
    "assisting_player_id" uuid,
    "team" text not null,
    "scored_at" timestamp with time zone not null default now()
);


CREATE UNIQUE INDEX match_players_pkey ON public.match_players USING btree (id);

CREATE UNIQUE INDEX matches_pkey ON public.matches USING btree (id);

CREATE UNIQUE INDEX player_positions_pkey ON public.player_positions USING btree (id);

CREATE UNIQUE INDEX players_email_key ON public.players USING btree (email);

CREATE UNIQUE INDEX players_pkey ON public.players USING btree (id);

CREATE UNIQUE INDEX scores_pkey ON public.scores USING btree (id);

alter table "public"."match_players" add constraint "match_players_pkey" PRIMARY KEY using index "match_players_pkey";

alter table "public"."matches" add constraint "matches_pkey" PRIMARY KEY using index "matches_pkey";

alter table "public"."player_positions" add constraint "player_positions_pkey" PRIMARY KEY using index "player_positions_pkey";

alter table "public"."players" add constraint "players_pkey" PRIMARY KEY using index "players_pkey";

alter table "public"."scores" add constraint "scores_pkey" PRIMARY KEY using index "scores_pkey";

alter table "public"."match_players" add constraint "match_players_match_id_fkey" FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE not valid;

alter table "public"."match_players" validate constraint "match_players_match_id_fkey";

alter table "public"."match_players" add constraint "match_players_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE not valid;

alter table "public"."match_players" validate constraint "match_players_player_id_fkey";

alter table "public"."match_players" add constraint "match_players_team_check" CHECK ((team = ANY (ARRAY['A'::text, 'B'::text]))) not valid;

alter table "public"."match_players" validate constraint "match_players_team_check";

alter table "public"."matches" add constraint "matches_status_check" CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'finished'::text]))) not valid;

alter table "public"."matches" validate constraint "matches_status_check";

alter table "public"."matches" add constraint "matches_winner_team_check" CHECK ((winner_team = ANY (ARRAY['A'::text, 'B'::text]))) not valid;

alter table "public"."matches" validate constraint "matches_winner_team_check";

alter table "public"."player_positions" add constraint "player_positions_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE not valid;

alter table "public"."player_positions" validate constraint "player_positions_player_id_fkey";

alter table "public"."player_positions" add constraint "player_positions_position_check" CHECK (("position" = ANY (ARRAY['Målvakt'::text, 'Back'::text, 'Center'::text, 'Forward'::text]))) not valid;

alter table "public"."player_positions" validate constraint "player_positions_position_check";

alter table "public"."player_positions" add constraint "player_positions_preference_check" CHECK ((preference = ANY (ARRAY['primary'::text, 'secondary'::text]))) not valid;

alter table "public"."player_positions" validate constraint "player_positions_preference_check";

alter table "public"."players" add constraint "players_email_key" UNIQUE using index "players_email_key";

alter table "public"."scores" add constraint "scores_assisting_player_id_fkey" FOREIGN KEY (assisting_player_id) REFERENCES players(id) ON DELETE SET NULL not valid;

alter table "public"."scores" validate constraint "scores_assisting_player_id_fkey";

alter table "public"."scores" add constraint "scores_match_id_fkey" FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE not valid;

alter table "public"."scores" validate constraint "scores_match_id_fkey";

alter table "public"."scores" add constraint "scores_scoring_player_id_fkey" FOREIGN KEY (scoring_player_id) REFERENCES players(id) ON DELETE SET NULL not valid;

alter table "public"."scores" validate constraint "scores_scoring_player_id_fkey";

alter table "public"."scores" add constraint "scores_team_check" CHECK ((team = ANY (ARRAY['A'::text, 'B'::text]))) not valid;

alter table "public"."scores" validate constraint "scores_team_check";

grant delete on table "public"."match_players" to "anon";

grant insert on table "public"."match_players" to "anon";

grant references on table "public"."match_players" to "anon";

grant select on table "public"."match_players" to "anon";

grant trigger on table "public"."match_players" to "anon";

grant truncate on table "public"."match_players" to "anon";

grant update on table "public"."match_players" to "anon";

grant delete on table "public"."match_players" to "authenticated";

grant insert on table "public"."match_players" to "authenticated";

grant references on table "public"."match_players" to "authenticated";

grant select on table "public"."match_players" to "authenticated";

grant trigger on table "public"."match_players" to "authenticated";

grant truncate on table "public"."match_players" to "authenticated";

grant update on table "public"."match_players" to "authenticated";

grant delete on table "public"."match_players" to "service_role";

grant insert on table "public"."match_players" to "service_role";

grant references on table "public"."match_players" to "service_role";

grant select on table "public"."match_players" to "service_role";

grant trigger on table "public"."match_players" to "service_role";

grant truncate on table "public"."match_players" to "service_role";

grant update on table "public"."match_players" to "service_role";

grant delete on table "public"."matches" to "anon";

grant insert on table "public"."matches" to "anon";

grant references on table "public"."matches" to "anon";

grant select on table "public"."matches" to "anon";

grant trigger on table "public"."matches" to "anon";

grant truncate on table "public"."matches" to "anon";

grant update on table "public"."matches" to "anon";

grant delete on table "public"."matches" to "authenticated";

grant insert on table "public"."matches" to "authenticated";

grant references on table "public"."matches" to "authenticated";

grant select on table "public"."matches" to "authenticated";

grant trigger on table "public"."matches" to "authenticated";

grant truncate on table "public"."matches" to "authenticated";

grant update on table "public"."matches" to "authenticated";

grant delete on table "public"."matches" to "service_role";

grant insert on table "public"."matches" to "service_role";

grant references on table "public"."matches" to "service_role";

grant select on table "public"."matches" to "service_role";

grant trigger on table "public"."matches" to "service_role";

grant truncate on table "public"."matches" to "service_role";

grant update on table "public"."matches" to "service_role";

grant delete on table "public"."player_positions" to "anon";

grant insert on table "public"."player_positions" to "anon";

grant references on table "public"."player_positions" to "anon";

grant select on table "public"."player_positions" to "anon";

grant trigger on table "public"."player_positions" to "anon";

grant truncate on table "public"."player_positions" to "anon";

grant update on table "public"."player_positions" to "anon";

grant delete on table "public"."player_positions" to "authenticated";

grant insert on table "public"."player_positions" to "authenticated";

grant references on table "public"."player_positions" to "authenticated";

grant select on table "public"."player_positions" to "authenticated";

grant trigger on table "public"."player_positions" to "authenticated";

grant truncate on table "public"."player_positions" to "authenticated";

grant update on table "public"."player_positions" to "authenticated";

grant delete on table "public"."player_positions" to "service_role";

grant insert on table "public"."player_positions" to "service_role";

grant references on table "public"."player_positions" to "service_role";

grant select on table "public"."player_positions" to "service_role";

grant trigger on table "public"."player_positions" to "service_role";

grant truncate on table "public"."player_positions" to "service_role";

grant update on table "public"."player_positions" to "service_role";

grant delete on table "public"."players" to "anon";

grant insert on table "public"."players" to "anon";

grant references on table "public"."players" to "anon";

grant select on table "public"."players" to "anon";

grant trigger on table "public"."players" to "anon";

grant truncate on table "public"."players" to "anon";

grant update on table "public"."players" to "anon";

grant delete on table "public"."players" to "authenticated";

grant insert on table "public"."players" to "authenticated";

grant references on table "public"."players" to "authenticated";

grant select on table "public"."players" to "authenticated";

grant trigger on table "public"."players" to "authenticated";

grant truncate on table "public"."players" to "authenticated";

grant update on table "public"."players" to "authenticated";

grant delete on table "public"."players" to "service_role";

grant insert on table "public"."players" to "service_role";

grant references on table "public"."players" to "service_role";

grant select on table "public"."players" to "service_role";

grant trigger on table "public"."players" to "service_role";

grant truncate on table "public"."players" to "service_role";

grant update on table "public"."players" to "service_role";

grant delete on table "public"."scores" to "anon";

grant insert on table "public"."scores" to "anon";

grant references on table "public"."scores" to "anon";

grant select on table "public"."scores" to "anon";

grant trigger on table "public"."scores" to "anon";

grant truncate on table "public"."scores" to "anon";

grant update on table "public"."scores" to "anon";

grant delete on table "public"."scores" to "authenticated";

grant insert on table "public"."scores" to "authenticated";

grant references on table "public"."scores" to "authenticated";

grant select on table "public"."scores" to "authenticated";

grant trigger on table "public"."scores" to "authenticated";

grant truncate on table "public"."scores" to "authenticated";

grant update on table "public"."scores" to "authenticated";

grant delete on table "public"."scores" to "service_role";

grant insert on table "public"."scores" to "service_role";

grant references on table "public"."scores" to "service_role";

grant select on table "public"."scores" to "service_role";

grant trigger on table "public"."scores" to "service_role";

grant truncate on table "public"."scores" to "service_role";

grant update on table "public"."scores" to "service_role";


