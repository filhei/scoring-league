drop policy "Users can nullify their own account" on "public"."players";

drop policy "Users can update their own record" on "public"."players";

alter table "public"."players" add column "list_name" text;

create policy "Users can nullify their own account"
on "public"."players"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check (((id = ( SELECT players_1.id
   FROM players players_1
  WHERE (players_1.user_id = auth.uid()))) AND (list_name = ( SELECT players_1.list_name
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
  WHERE (players_1.user_id = auth.uid()))) AND (user_id = auth.uid()) AND (list_name = ( SELECT players_1.list_name
   FROM players players_1
  WHERE (players_1.user_id = auth.uid())))));



