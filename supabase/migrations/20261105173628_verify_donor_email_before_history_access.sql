-- Only a currently verified Supabase Auth email may claim giving by email.
-- Keep the verification lookup inside a non-exposed schema.
create schema if not exists giving_security;
revoke all on schema giving_security from public, anon;
grant usage on schema giving_security to authenticated;

create or replace function giving_security.is_confirmed_donor_account()
returns boolean
language sql stable security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from auth.users u
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and coalesce(u.email_change, '') = ''
      and not coalesce(u.is_anonymous, false)
  );
$function$;

create or replace function giving_security.confirmed_donor_email_matches(p_contact_email text)
returns boolean
language sql stable security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from auth.users u
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and coalesce(u.email_change, '') = ''
      and not coalesce(u.is_anonymous, false)
      and nullif(btrim(p_contact_email), '') is not null
      and lower(btrim(u.email)) = lower(btrim(p_contact_email))
  );
$function$;

revoke all on function giving_security.is_confirmed_donor_account() from public, anon;
revoke all on function giving_security.confirmed_donor_email_matches(text) from public, anon;
grant execute on function giving_security.is_confirmed_donor_account() to authenticated;
grant execute on function giving_security.confirmed_donor_email_matches(text) to authenticated;

do $migration$
begin
  if to_regclass('public.giving_transactions') is null then
    raise notice 'Skipping giving_transactions policy replacement: giving module is not in the fresh migration baseline.';
    return;
  end if;

  drop policy if exists members_read_matching_email_transactions on public.giving_transactions;
  drop policy if exists members_read_own_transactions on public.giving_transactions;

  create policy members_read_matching_email_transactions
    on public.giving_transactions for select to authenticated
    using (giving_security.confirmed_donor_email_matches(contact_email));

  create policy members_read_own_transactions
    on public.giving_transactions for select to authenticated
    using (user_id = (select auth.uid())
      and giving_security.is_confirmed_donor_account());
end;
$migration$;
