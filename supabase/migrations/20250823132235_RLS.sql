alter table "public"."match_players" enable row level security;

alter table "public"."matches" enable row level security;

alter table "public"."player_positions" enable row level security;

alter table "public"."players" enable row level security;

alter table "public"."scores" enable row level security;

create policy "Anonymous can view match players"
on "public"."match_players"
as permissive
for select
to anon
using (true);


create policy "Authenticated can manage match players for non-finished matches"
on "public"."match_players"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM matches
  WHERE ((matches.id = match_players.match_id) AND (matches.match_status = ANY (ARRAY['active'::text, 'paused'::text, 'planned'::text]))))))
with check ((EXISTS ( SELECT 1
   FROM matches
  WHERE ((matches.id = match_players.match_id) AND (matches.match_status = ANY (ARRAY['active'::text, 'paused'::text, 'planned'::text]))))));


create policy "Authenticated can view match players"
on "public"."match_players"
as permissive
for select
to authenticated
using (true);


create policy "Service role can manage match players for finished matches"
on "public"."match_players"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Anonymous can view all matches"
on "public"."matches"
as permissive
for select
to anon
using (true);


create policy "Authenticated can create matches"
on "public"."matches"
as permissive
for insert
to authenticated
with check (true);


create policy "Authenticated can delete non-finished matches"
on "public"."matches"
as permissive
for delete
to authenticated
using ((match_status = ANY (ARRAY['active'::text, 'paused'::text, 'planned'::text])));


create policy "Authenticated can update non-finished matches"
on "public"."matches"
as permissive
for update
to authenticated
using ((match_status = ANY (ARRAY['active'::text, 'paused'::text, 'planned'::text])))
with check ((match_status = ANY (ARRAY['active'::text, 'paused'::text, 'planned'::text])));


create policy "Authenticated can view all matches"
on "public"."matches"
as permissive
for select
to authenticated
using (true);


create policy "Service role can manage finished matches"
on "public"."matches"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Anonymous can view player positions"
on "public"."player_positions"
as permissive
for select
to anon
using (true);


create policy "Authenticated can view player positions"
on "public"."player_positions"
as permissive
for select
to authenticated
using (true);


create policy "Service role can manage all positions"
on "public"."player_positions"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Users can manage their own positions"
on "public"."player_positions"
as permissive
for all
to authenticated
using ((player_id IN ( SELECT players.id
   FROM players
  WHERE (players.email = (( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text))))
with check ((player_id IN ( SELECT players.id
   FROM players
  WHERE (players.email = (( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text))));


create policy "Anonymous can view active player names"
on "public"."players"
as permissive
for select
to anon
using ((is_active = true));


create policy "Authenticated can view active players"
on "public"."players"
as permissive
for select
to authenticated
using ((is_active = true));


create policy "Service role can manage all players"
on "public"."players"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Users can soft delete their own account"
on "public"."players"
as permissive
for update
to authenticated
using ((email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text))
with check (((email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text) AND (is_active = false)));


create policy "Users can update their own name"
on "public"."players"
as permissive
for update
to authenticated
using ((email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text))
with check ((email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text));


create policy "Anonymous can view scores"
on "public"."scores"
as permissive
for select
to anon
using (true);


create policy "Authenticated can manage scores for non-finished matches"
on "public"."scores"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM matches
  WHERE ((matches.id = scores.match_id) AND (matches.match_status = ANY (ARRAY['active'::text, 'paused'::text, 'planned'::text]))))))
with check ((EXISTS ( SELECT 1
   FROM matches
  WHERE ((matches.id = scores.match_id) AND (matches.match_status = ANY (ARRAY['active'::text, 'paused'::text, 'planned'::text]))))));


create policy "Authenticated can view scores"
on "public"."scores"
as permissive
for select
to authenticated
using (true);


create policy "Service role can manage scores for finished matches"
on "public"."scores"
as permissive
for all
to service_role
using (true)
with check (true);



