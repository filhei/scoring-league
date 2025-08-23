drop policy "Users can soft delete their own account" on "public"."players";

drop policy "Users can update their own name" on "public"."players";

alter table "public"."players" add column "user_id" uuid;

CREATE UNIQUE INDEX players_user_id_key ON public.players USING btree (user_id);

alter table "public"."players" add constraint "players_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."players" validate constraint "players_user_id_fkey";

alter table "public"."players" add constraint "players_user_id_key" UNIQUE using index "players_user_id_key";

create policy "Users can soft delete their own account"
on "public"."players"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check (((user_id = auth.uid()) AND (is_active = false)));


create policy "Users can update their own name"
on "public"."players"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



