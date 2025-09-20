drop policy "Users can nullify their own account" on "public"."players";

create policy "Users can nullify their own account"
on "public"."players"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check (((id = ( SELECT players_1.id
   FROM players players_1
  WHERE (players_1.user_id = auth.uid()))) AND (list_name IS NULL) AND (name IS NULL) AND (elo IS NULL) AND (is_active IS NULL) AND (created_at IS NULL) AND (user_id IS NULL)));



