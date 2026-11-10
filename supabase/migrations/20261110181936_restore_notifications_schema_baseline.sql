-- Recover a missing migration-history baseline without modifying live notifications.
-- The hosted table already exists: all statements in this block are deliberately
-- skipped in that case, preserving rows, grants, triggers, policies and webhooks.
-- Never store live webhook secrets in migrations.
do $notifications_baseline$
begin
 if to_regclass('public.notifications') is not null then
  raise notice 'notifications already exists; preserving hosted table unchanged';
  return;
 end if;

 create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  prayer_request_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  testimony_id uuid,
  praise_report_id uuid,
  feedback_id uuid,
  application_id uuid,
  push_status text not null default 'pending'
   constraint notifications_push_status_check check
    (push_status in ('pending','sent','skipped','failed','not_applicable')),
  push_attempted_at timestamptz,
  push_delivered_at timestamptz,
  push_error text,
  reaction_actor_user_id uuid references auth.users(id) on delete set null,
  reaction_source_id uuid,
  campaign_id uuid
 );

 -- Add optional relationships only where their source modules are present.
 if to_regclass('public.prayer_requests') is not null then
  alter table public.notifications add constraint notifications_prayer_request_id_fkey
   foreign key (prayer_request_id) references public.prayer_requests(id) on delete cascade;
 end if;
 if to_regclass('public.testimonies') is not null then
  alter table public.notifications add constraint notifications_testimony_id_fkey
   foreign key (testimony_id) references public.testimonies(id) on delete set null;
 end if;
 if to_regclass('public.praise_reports') is not null then
  alter table public.notifications add constraint notifications_praise_report_id_fkey
   foreign key (praise_report_id) references public.praise_reports(id) on delete set null;
 end if;
 if to_regclass('public.feedback_messages') is not null then
  alter table public.notifications add constraint notifications_feedback_id_fkey
   foreign key (feedback_id) references public.feedback_messages(id) on delete set null;
 end if;
 if to_regclass('public.prayer_care_applications') is not null then
  alter table public.notifications add constraint notifications_application_id_fkey
   foreign key (application_id) references public.prayer_care_applications(id) on delete set null;
 end if;
 if to_regclass('public.notification_campaigns') is not null then
  alter table public.notifications add constraint notifications_campaign_id_fkey
   foreign key (campaign_id) references public.notification_campaigns(id) on delete set null;
 end if;

 create index notifications_user_id_idx on public.notifications(user_id);
 create index notifications_unread_idx on public.notifications(user_id) where read_at is null;
 create index notifications_push_attention_idx on public.notifications(push_status, created_at desc)
  where push_status in ('pending','failed');
 create index notifications_campaign_idx on public.notifications(campaign_id,created_at desc);
 create unique index notifications_unique_community_reaction
  on public.notifications(user_id,type,reaction_source_id,reaction_actor_user_id)
  where type in ('praise_loved','testimony_encouraged')
   and reaction_source_id is not null and reaction_actor_user_id is not null;

 alter table public.notifications enable row level security;
 revoke all on table public.notifications from public, anon, authenticated;
 grant select,update,delete on table public.notifications to authenticated;
 grant select,insert,update,delete on table public.notifications to service_role;

 create policy notifications_select_own on public.notifications
  for select to authenticated using ((select auth.uid())=user_id);
 create policy notifications_update_own on public.notifications
  for update to authenticated using ((select auth.uid())=user_id)
    with check ((select auth.uid())=user_id);
 create policy notifications_delete_own on public.notifications
  for delete to authenticated using ((select auth.uid())=user_id);
end;
$notifications_baseline$;
