begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

-- This module is deployed independently of the legacy fresh-local baseline.
-- Recreate only its smallest table contract to verify the Auth helper and RLS.
create table public.giving_transactions (
  id uuid primary key,
  user_id uuid,
  contact_email text
);
alter table public.giving_transactions enable row level security;
grant select on public.giving_transactions to authenticated;

create policy members_read_matching_email_transactions
  on public.giving_transactions for select to authenticated
  using (giving_security.confirmed_donor_email_matches(contact_email));
create policy members_read_own_transactions
  on public.giving_transactions for select to authenticated
  using (user_id = (select auth.uid()) and giving_security.is_confirmed_donor_account());

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
 ('00000000-0000-4000-8000-000000000911','00000000-0000-0000-0000-000000000000','authenticated','authenticated','verified@example.test',now(),now(),now()),
 ('00000000-0000-4000-8000-000000000912','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pending@example.test',null,now(),now());

insert into public.giving_transactions(id,user_id,contact_email) values
 ('00000000-0000-4000-8000-000000000921',null,'verified@example.test'),
 ('00000000-0000-4000-8000-000000000922',null,'other@example.test'),
 ('00000000-0000-4000-8000-000000000923','00000000-0000-4000-8000-000000000911',null),
 ('00000000-0000-4000-8000-000000000924','00000000-0000-4000-8000-000000000912',null);

select ok(not has_function_privilege('anon', 'giving_security.confirmed_donor_email_matches(text)', 'EXECUTE'),
 'anonymous role cannot execute donor verification helper');
select ok(not has_function_privilege('anon', 'giving_security.is_confirmed_donor_account()', 'EXECUTE'),
 'anonymous role cannot execute account verification helper');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000911',true);
set local role authenticated;
select is((select count(*)::integer from public.giving_transactions),2,
 'verified email owner sees only matching-email and linked transactions');
select ok(giving_security.confirmed_donor_email_matches(' VERIFIED@example.test '),
 'verified ownership compares normalized email');
select ok(not giving_security.confirmed_donor_email_matches('other@example.test'),
 'verified donor cannot claim another email');
reset role;

update auth.users set email_change='new@example.test'
 where id='00000000-0000-4000-8000-000000000911';
set local role authenticated;
select is((select count(*)::integer from public.giving_transactions),0,
 'pending email change suspends donor access');
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000912',true);
set local role authenticated;
select is((select count(*)::integer from public.giving_transactions),0,
 'unconfirmed account cannot claim gifts, even linked rows');
select ok(not giving_security.confirmed_donor_email_matches('pending@example.test'),
 'unconfirmed email is not an ownership proof');
reset role;

select * from finish();
rollback;
