begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

create table public.profiles (
  id uuid primary key,
  role text not null
);

create table public.devotion_weeks (
  id uuid primary key,
  status text not null
);

alter table public.devotion_weeks enable row level security;

create policy "Admins can view all devotion weeks"
on public.devotion_weeks
for select
to public
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "Public can read published devotion weeks"
on public.devotion_weeks
for select
to public
using (status = 'published');

alter policy "Admins can view all devotion weeks"
on public.devotion_weeks
to authenticated;

grant select on public.devotion_weeks to anon;
insert into public.devotion_weeks (id, status)
values ('00000000-0000-0000-0000-000000000201', 'published');

select results_eq(
  $$select roles from pg_policies
    where schemaname = 'public'
      and tablename = 'devotion_weeks'
      and policyname = 'Admins can view all devotion weeks'$$,
  $$values (array['authenticated']::name[])$$,
  'the admin lookup policy runs only for signed-in users'
);

set local role anon;
select lives_ok(
  $$select count(*) from public.devotion_weeks where status = 'published'$$,
  'anonymous visitors can read published devotions without profile access'
);

select * from finish();
rollback;
