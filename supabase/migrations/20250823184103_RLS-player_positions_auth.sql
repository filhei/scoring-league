drop policy "Users can manage their own positions" on "public"."player_positions";

create policy "Users can manage their own positions"
on "public"."player_positions"
as permissive
for all
to authenticated
using ((player_id IN ( SELECT players.id
   FROM players
  WHERE (players.user_id = auth.uid()))))
with check ((player_id IN ( SELECT players.id
   FROM players
  WHERE (players.user_id = auth.uid()))));



