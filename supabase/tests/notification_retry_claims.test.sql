begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_column('public','notifications','push_attempt_count','retry count is persisted');
select has_column('public','notifications','push_next_attempt_at','next retry time is persisted');
select has_column('public','notifications','push_claim_token','worker claim token is persisted');
select has_column('public','notifications','push_claimed_until','worker lease is persisted');
select has_column('public','notifications','push_delivered_subscription_ids','successful devices are persisted for missing-recipient retries');
select ok(has_function_privilege('service_role','public.claim_notification_push_delivery(uuid)','EXECUTE'),
  'only the trusted worker can claim delivery');
select ok(not has_function_privilege('authenticated','public.claim_notification_push_delivery(uuid)','EXECUTE'),
  'members cannot claim delivery');

insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at) values
 ('00000000-0000-4000-8000-000000000e31','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','retry-notice@example.test',now(),now());
insert into public.notifications(id,user_id,type,title,push_status) values
 ('00000000-0000-4000-8000-000000000e32','00000000-0000-4000-8000-000000000e31',
  'test','Retry claim test','pending');

select is((select count(*)::integer from public.claim_notification_push_delivery(
 '00000000-0000-4000-8000-000000000e32')),1,'first worker receives the notification claim');
select is((select count(*)::integer from public.claim_notification_push_delivery(
 '00000000-0000-4000-8000-000000000e32')),0,'overlapping worker cannot claim an active notification');

select ok(public.complete_notification_push_delivery(
 '00000000-0000-4000-8000-000000000e32',
 (select push_claim_token from public.notifications where id='00000000-0000-4000-8000-000000000e32'),
 'failed','simulated provider failure',array['00000000-0000-4000-8000-000000000e33'::uuid]),'failed delivery is recorded by its claim owner');
select is((select push_status from public.notifications where id='00000000-0000-4000-8000-000000000e32'),
 'failed','transient provider failure remains visible');
select ok((select push_next_attempt_at > now() from public.notifications
 where id='00000000-0000-4000-8000-000000000e32'),'failed delivery receives a future retry time');
select ok((select push_delivered_subscription_ids @> array['00000000-0000-4000-8000-000000000e33'::uuid] from public.notifications
 where id='00000000-0000-4000-8000-000000000e32'),'previously successful device is persisted for the retry');
select is((select count(*)::integer from public.claim_notification_push_delivery(
 '00000000-0000-4000-8000-000000000e32')),0,'worker cannot retry before the backoff expires');

update public.notifications set push_next_attempt_at=now()
 where id='00000000-0000-4000-8000-000000000e32';
select is((select count(*)::integer from public.claim_notification_push_delivery(
 '00000000-0000-4000-8000-000000000e32')
 where delivered_subscription_ids @> array['00000000-0000-4000-8000-000000000e33'::uuid]),1,
 'due retry includes previously successful device IDs');
select ok(public.complete_notification_push_delivery(
 '00000000-0000-4000-8000-000000000e32',
 (select push_claim_token from public.notifications where id='00000000-0000-4000-8000-000000000e32'),
 'sent',null),'successful retry is recorded');
select is((select push_status from public.notifications where id='00000000-0000-4000-8000-000000000e32'),
 'sent','successful retry clears failed state');
select is((select push_attempt_count from public.notifications where id='00000000-0000-4000-8000-000000000e32'),
 2,'attempt count includes each claim');

select * from finish();
rollback;
