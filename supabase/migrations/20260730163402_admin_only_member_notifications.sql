-- New-member alerts link to the admin user-management page, so they are
-- operational notifications rather than community announcements.
create or replace function public.notify_new_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select
    prof.id,
    'new_member',
    'A new member joined',
    coalesce(new.full_name, 'A new member') || ' just joined the community.',
    '/admin/users'
  from public.profiles prof
  where prof.role = 'admin'
    and prof.id is distinct from new.id;

  return new;
end;
$$;

-- Remove only the operational alerts that were previously delivered to
-- non-admin accounts. Member-facing notification types are left untouched.
delete from public.notifications n
using public.profiles recipient
where n.user_id = recipient.id
  and n.type = 'new_member'
  and recipient.role <> 'admin';
