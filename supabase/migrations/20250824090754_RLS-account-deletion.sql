drop policy "Anonymous can view active player names" on "public"."players";

drop policy "Authenticated can view active players" on "public"."players";

drop policy "Users can soft delete their own account" on "public"."players";

drop policy "Users can update their own name" on "public"."players";

alter table "public"."players" drop constraint "players_email_key";

drop index if exists "public"."players_email_key";

alter table "public"."players" drop column "email";

alter table "public"."players" alter column "name" drop not null;

create policy "Anonymous can view all players"
on "public"."players"
as permissive
for select
to anon
using (true);


create policy "Authenticated can view all players"
on "public"."players"
as permissive
for select
to authenticated
using (true);


create policy "Users can nullify their own account"
on "public"."players"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check (((id = ( SELECT players_1.id
   FROM players players_1
  WHERE (players_1.user_id = auth.uid()))) AND (name IS NULL) AND (elo IS NULL) AND (is_active IS NULL) AND (created_at IS NULL) AND (user_id IS NULL)));


create policy "Users can update their own record"
on "public"."players"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check (((id = ( SELECT players_1.id
   FROM players players_1
  WHERE (players_1.user_id = auth.uid()))) AND (created_at = ( SELECT players_1.created_at
   FROM players players_1
  WHERE (players_1.user_id = auth.uid()))) AND (user_id = auth.uid())));



