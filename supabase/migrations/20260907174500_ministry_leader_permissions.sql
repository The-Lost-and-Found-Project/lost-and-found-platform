drop policy if exists "leaders manage ministry content" on public.ministry_content;
create policy "leaders manage ministry content" on public.ministry_content for all to authenticated
using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or exists(select 1 from public.ministry_memberships m where m.user_id=auth.uid() and m.ministry_slug=ministry_content.ministry_slug and m.membership_role='leader')
)
with check (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or exists(select 1 from public.ministry_memberships m where m.user_id=auth.uid() and m.ministry_slug=ministry_content.ministry_slug and m.membership_role='leader')
);
