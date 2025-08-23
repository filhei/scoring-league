drop policy "Authenticated can update non-finished matches" on "public"."matches";

create policy "Authenticated can update non-finished matches or finish a match"
on "public"."matches"
as permissive
for update
to authenticated
using ((match_status = ANY (ARRAY['active'::text, 'paused'::text, 'planned'::text])))
with check ((match_status = ANY (ARRAY['active'::text, 'paused'::text, 'planned'::text, 'finished'::text])));



