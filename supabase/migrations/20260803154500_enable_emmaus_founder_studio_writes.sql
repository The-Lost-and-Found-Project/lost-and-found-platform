create or replace function public.is_emmaus_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select session_user = 'postgres'
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_emmaus_admin() from public, anon;
grant execute on function public.is_emmaus_admin() to authenticated;

create policy "Admins can view all Discovery Maps"
on public.emmaus_discovery_maps
for select
to authenticated
using (public.is_emmaus_admin());

create policy "Admins can create Discovery Maps"
on public.emmaus_discovery_maps
for insert
to authenticated
with check (public.is_emmaus_admin());

create policy "Admins can update Discovery Maps"
on public.emmaus_discovery_maps
for update
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());

create policy "Admins can delete Discovery Maps"
on public.emmaus_discovery_maps
for delete
to authenticated
using (public.is_emmaus_admin());

create policy "Admins can view all Discovery Map stops"
on public.emmaus_discovery_map_stops
for select
to authenticated
using (public.is_emmaus_admin());

create policy "Admins can create Discovery Map stops"
on public.emmaus_discovery_map_stops
for insert
to authenticated
with check (public.is_emmaus_admin());

create policy "Admins can update Discovery Map stops"
on public.emmaus_discovery_map_stops
for update
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());

create policy "Admins can delete Discovery Map stops"
on public.emmaus_discovery_map_stops
for delete
to authenticated
using (public.is_emmaus_admin());

create policy "Admins can view all discovery catalog entries"
on public.emmaus_discovery_catalog
for select
to authenticated
using (public.is_emmaus_admin());
