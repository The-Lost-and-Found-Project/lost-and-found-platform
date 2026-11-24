begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

select has_column('public','notifications','push_attempt_count','retry count is persisted');
select has_column('public','notifications','push_next_attempt_at','next retry time is persisted');
select has_column('public','notifications','push_claim_token','worker claim token is persisted');
select has_column('public','notifications','push_claimed_until','worker lease is persisted');
select has_column('public','notifications','push_delivered_subscription_ids','successful devices are persisted for missing-recipient retries');
select has_column('public','notifications','push_delivery_uncertain','expired worker leases are held for reconciliation');
select has_table('public','notification_push_reconciliations','manual retries leave an audit record');
select ok(has_function_privilege('service_role','public.requeue_uncertain_notification_push(uuid,uuid,text)','EXECUTE'),
  'only the server may invoke reconciliation');
select ok(not has_function_privilege('authenticated','public.requeue_uncertain_notification_push(uuid,uuid,text)','EXECUTE'),
  'members cannot reconcile or restart push delivery');
select ok(not has_table_privilege('authenticated','public.notification_push_reconciliations','SELECT'),
  'members cannot read reconciliation notes');
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

insert into public.notifications(id,user_id,type,title,push_status) values
 ('00000000-0000-4000-8000-000000000e34','00000000-0000-4000-8000-000000000e31',
  'test','Expired claim test','pending');
select is((select count(*)::integer from public.claim_notification_push_delivery(
 '00000000-0000-4000-8000-000000000e34')),1,'worker receives the second notification claim');
update public.notifications
 set push_claimed_until=now()-interval '1 second'
 where id='00000000-0000-4000-8000-000000000e34';
select is((select count(*)::integer from public.claim_notification_push_delivery(
 '00000000-0000-4000-8000-000000000e34')),0,'expired worker result is not automatically resent');
select ok((select push_delivery_uncertain from public.notifications
 where id='00000000-0000-4000-8000-000000000e34'),'expired lease becomes visible as uncertain');
select is((select push_status from public.notifications
 where id='00000000-0000-4000-8000-000000000e34'),'failed',
 'uncertain delivery remains visible as a failure');
select ok((select push_next_attempt_at is null from public.notifications
 where id='00000000-0000-4000-8000-000000000e34'),'uncertain delivery has no automatic retry time');
select is((select uncertain_count from public.get_notification_delivery_health()),1::bigint,
 'admin health summary includes uncertain outcomes without recipient data');
select is((select count(*)::integer from public.claim_notification_push_delivery(
 '00000000-0000-4000-8000-000000000e34')),0,'uncertain delivery remains blocked pending review');
select ok(public.requeue_uncertain_notification_push(
 '00000000-0000-4000-8000-000000000e34',
 '00000000-0000-4000-8000-000000000e31',
 'Reviewed delivery evidence; approve one retry.'),'admin reconciliation explicitly releases the retry');
select ok((select not push_delivery_uncertain from public.notifications
 where id='00000000-0000-4000-8000-000000000e34'),'reviewed retry clears uncertain state');
select is((select push_attempt_count from public.notifications
 where id='00000000-0000-4000-8000-000000000e34'),0,'reviewed retry starts a fresh bounded attempt sequence');
select is((select count(*)::integer from public.notification_push_reconciliations
 where notification_id='00000000-0000-4000-8000-000000000e34'
   and actor_user_id='00000000-0000-4000-8000-000000000e31'
   and reason='Reviewed delivery evidence; approve one retry.'),1,
 'reconciliation reason and actor are retained');
select ok(not public.requeue_uncertain_notification_push(
 '00000000-0000-4000-8000-000000000e34',
 '00000000-0000-4000-8000-000000000e31',
 'Duplicate reconciliation attempt.'),'reconciliation cannot requeue the same notification twice');
select is((select count(*)::integer from public.claim_notification_push_delivery(
 '00000000-0000-4000-8000-000000000e34')),1,'only the reviewed notification becomes claimable again');

select * from finish();
rollback;
