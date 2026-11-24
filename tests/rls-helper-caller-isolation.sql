\set ON_ERROR_STOP on
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$ begin
 if public.is_lfp_admin('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') then raise exception 'cross-user admin lookup'; end if;
 if public.is_study_group_facilitator('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111') then raise exception 'cross-user facilitator lookup'; end if;
 if public.has_locked_group_response('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111',1) then raise exception 'cross-user response lookup'; end if;
 if public.is_daily_path_day_unlocked('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111',1) then raise exception 'cross-user unlock lookup'; end if;
end $$;
rollback;
select 'PASS: all four privileged helpers deny cross-user queries';
