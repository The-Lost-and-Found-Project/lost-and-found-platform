-- Praise Love is an acknowledgement, not a repeatable activity. Preserve the
-- existing praise data and enforce one Love per Community Member per report.
alter table public.praise_reports
  add column if not exists love_count integer not null default 0;

alter table public.praise_reports
  drop constraint if exists praise_reports_love_count_check;

alter table public.praise_reports
  add constraint praise_reports_love_count_check check (love_count >= 0);

create table if not exists public.praise_loves (
  id uuid primary key default gen_random_uuid(),
  praise_report_id uuid not null references public.praise_reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint praise_loves_one_per_member unique (praise_report_id, user_id)
);

alter table public.praise_loves enable row level security;

drop policy if exists praise_loves_select_own on public.praise_loves;
create policy praise_loves_select_own
on public.praise_loves
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists praise_loves_insert_own on public.praise_loves;
create policy praise_loves_insert_own
on public.praise_loves
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active is true
  )
  and exists (
    select 1 from public.praise_reports
    where praise_reports.id = praise_loves.praise_report_id
      and praise_reports.moderation_status = 'approved'
  )
);

drop policy if exists praise_loves_delete_own on public.praise_loves;
create policy praise_loves_delete_own
on public.praise_loves
for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.praise_loves from anon;
grant select, insert, delete on table public.praise_loves to authenticated;
grant select, insert, update, delete on table public.praise_loves to service_role;

create or replace function public.update_praise_love_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.praise_reports
    set love_count = love_count + 1
    where id = new.praise_report_id;
    return new;
  end if;

  update public.praise_reports
  set love_count = greatest(love_count - 1, 0)
  where id = old.praise_report_id;
  return old;
end;
$$;

revoke all on function public.update_praise_love_count() from public;
revoke all on function public.update_praise_love_count() from anon;
revoke all on function public.update_praise_love_count() from authenticated;

drop trigger if exists update_praise_love_count_after_insert on public.praise_loves;
create trigger update_praise_love_count_after_insert
after insert on public.praise_loves
for each row execute function public.update_praise_love_count();

drop trigger if exists update_praise_love_count_after_delete on public.praise_loves;
create trigger update_praise_love_count_after_delete
after delete on public.praise_loves
for each row execute function public.update_praise_love_count();

-- Reconcile safely if this migration is replayed after any rows exist.
update public.praise_reports reports
set love_count = counts.love_count
from (
  select praise_report_id, count(*)::integer as love_count
  from public.praise_loves
  group by praise_report_id
) counts
where reports.id = counts.praise_report_id;

update public.praise_reports reports
set love_count = 0
where love_count <> 0
  and not exists (
    select 1 from public.praise_loves loves
    where loves.praise_report_id = reports.id
  );

create or replace view public.praise_wall_public
with (security_barrier = true)
as
select id, content_text, created_at, love_count
from public.praise_reports
where moderation_status = 'approved';

grant select on table public.praise_wall_public to anon, authenticated;
