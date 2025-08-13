alter table "public"."matches" drop constraint "matches_status_check";

alter table "public"."matches" add column "duration" interval;

alter table "public"."matches" add column "pause_duration" interval;

alter table "public"."scores" drop column "scored_at";

alter table "public"."scores" add column "score_time" interval not null;

alter table "public"."matches" add constraint "matches_status_check" CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'paused'::text, 'finished'::text]))) not valid;

alter table "public"."matches" validate constraint "matches_status_check";


