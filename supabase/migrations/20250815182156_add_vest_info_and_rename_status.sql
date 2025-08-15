alter table "public"."matches" drop constraint "matches_status_check";

alter table "public"."matches" drop column "status";

alter table "public"."matches" add column "match_status" text not null default 'planned'::text;

alter table "public"."matches" add column "team_with_vests" text;

alter table "public"."matches" add constraint "matches_match_status_check" CHECK ((match_status = ANY (ARRAY['planned'::text, 'active'::text, 'paused'::text, 'finished'::text]))) not valid;

alter table "public"."matches" validate constraint "matches_match_status_check";

alter table "public"."matches" add constraint "matches_team_with_vests_check" CHECK ((team_with_vests = ANY (ARRAY['A'::text, 'B'::text]))) not valid;

alter table "public"."matches" validate constraint "matches_team_with_vests_check";


