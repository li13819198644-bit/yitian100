\set QUIET on
create function public.test_payload() returns jsonb language sql as $$
  select jsonb_build_object('schemaVersion', 1, 'date', current_date::text, 'timeZone', 'UTC',
    'preferences', jsonb_build_object('reliefMode', true, 'dailyTarget', 100),
    'vocabulary', jsonb_build_object('uniqueWords', 0, 'detailCoverage', 'complete', 'results', '[]'::jsonb),
    'grammar', jsonb_build_object('questions', 0, 'firstCorrect', 0, 'firstCount', 0));
$$;
create function public.test_result(hook text default '找不同，仔细看才辨出差别') returns jsonb language sql as $$
  select jsonb_build_object('schemaVersion', 1, 'cardDrafts', jsonb_build_array(jsonb_build_object(
    'wordId', 'discern', 'word', 'discern', 'hook', hook, 'example', 'I discern a difference.', 'translation', '我辨出一处不同。')));
$$;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select public.upload_daily_learning_report(public.test_payload());
select public.upload_daily_learning_report(public.test_payload());
do $$begin
  if (select count(*) from public.daily_learning_reports) <> 1 or (select count(*) from public.daily_analysis_jobs) <> 1 then raise exception 'duplicate upload counted twice'; end if;
  begin update public.daily_analysis_jobs set status = 'completed'; raise exception 'client can forge results'; exception when insufficient_privilege then null; end;
  begin perform public.claim_daily_analysis_job(); raise exception 'client can claim workers'; exception when insufficient_privilege then null; end;
end;$$;
reset role;
do $$begin
  if (select count(*) from net.requests) <> 1 then raise exception 'duplicate webhook'; end if;
  if (select headers->>'x-analysis-secret' from net.requests limit 1) <> 'test-worker-secret' then raise exception 'missing worker auth'; end if;
  if not exists (select 1 from cron.jobs where schedule = '*/10 * * * *') then raise exception 'retry schedule missing'; end if;
end;$$;

set role service_role;
create temporary table old_lease as select * from public.claim_daily_analysis_job();
do $$begin if exists(select * from public.claim_daily_analysis_job()) then raise exception 'job claimed twice'; end if; end;$$;
grant select on old_lease to authenticated;
reset role;
set role authenticated;
select public.upload_daily_learning_report(jsonb_set(public.test_payload(), '{preferences,dailyTarget}', '50'));
reset role;
set role service_role;
do $$begin
  if public.finish_daily_analysis_job((select id from old_lease), (select lease_token from old_lease), public.test_result()) then raise exception 'stale upload won race'; end if;
end;$$;
create temporary table current_lease as select * from public.claim_daily_analysis_job();
reset role;
update public.daily_analysis_jobs set lease_until = now() - interval '1 second' where id = (select id from current_lease);
set role service_role;
create temporary table reclaimed as select * from public.claim_daily_analysis_job();
grant select on reclaimed to authenticated;
do $$begin
  if public.finish_daily_analysis_job((select id from current_lease), (select lease_token from current_lease), public.test_result()) then raise exception 'expired lease published'; end if;
  if not public.finish_daily_analysis_job((select id from reclaimed), (select lease_token from reclaimed), public.test_result()) then raise exception 'valid lease did not finish'; end if;
end;$$;
reset role;

set role authenticated;
select public.accept_daily_word_card((select id from public.latest_daily_analysis_jobs), 'discern');
select public.accept_daily_word_card((select id from public.latest_daily_analysis_jobs), 'discern');
do $$begin
  if (select count(*) from public.personal_word_card_versions where is_active) <> 1 then raise exception 'duplicate active cards'; end if;
end;$$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$begin
  if exists(select 1 from public.daily_learning_reports) or exists(select 1 from public.daily_analysis_jobs) or exists(select 1 from public.personal_word_card_versions) then raise exception 'cross account read'; end if;
  begin perform public.accept_daily_word_card((select id from reclaimed), 'discern'); raise exception 'cross account adoption'; exception when others then if sqlerrm = 'cross account adoption' then raise; end if; end;
end;$$;
select public.restore_original_word_card('discern');
reset role;
do $$begin if (select count(*) from public.personal_word_card_versions where is_active) <> 1 then raise exception 'cross account restore'; end if; end;$$;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select public.restore_original_word_card('discern');
do $$begin
  if exists(select 1 from public.personal_word_card_versions where is_active) or (select count(*) from public.personal_word_card_versions) <> 1 then raise exception 'restore lost history'; end if;
end;$$;
select public.upload_daily_learning_report(jsonb_set(public.test_payload(), '{preferences,dailyTarget}', '25'));
reset role;
set role service_role;
create temporary table failure_lease as select * from public.claim_daily_analysis_job();
select public.fail_daily_analysis_job((select id from failure_lease), (select lease_token from failure_lease));
do $$begin if exists(select * from public.claim_daily_analysis_job()) then raise exception 'backoff ignored'; end if; end;$$;
reset role;
set role authenticated;
select public.upload_daily_learning_report(jsonb_set(public.test_payload(), '{preferences,dailyTarget}', '25'));
reset role;
do $$begin
  if (select count(*) from public.daily_analysis_jobs) <> 3 then raise exception 'manual retry duplicated job'; end if;
end;$$;
set role service_role;
create temporary table final_lease as select * from public.claim_daily_analysis_job();
reset role;
update public.daily_analysis_jobs set attempts = 5, lease_until = now() - interval '1 second' where id = (select id from final_lease);
set role service_role;
select * from public.claim_daily_analysis_job();
reset role;
do $$begin
  if (select status from public.daily_analysis_jobs where id = (select id from final_lease)) <> 'failed' then raise exception 'exhausted lease stuck processing'; end if;
end;$$;
set role authenticated;
select public.upload_daily_learning_report(jsonb_set(public.test_payload(), '{preferences,dailyTarget}', '25'));
reset role;
set role service_role;
create temporary table adopted_lease as select * from public.claim_daily_analysis_job();
select public.finish_daily_analysis_job((select id from adopted_lease), (select lease_token from adopted_lease), public.test_result('第二版找不同场景'));
grant select on adopted_lease to authenticated;
reset role;
set role authenticated;
select public.accept_daily_word_card((select id from adopted_lease), 'discern');
do $$begin
  if (select count(*) from public.personal_word_card_versions) <> 2 or (select count(*) from public.personal_word_card_versions where is_active) <> 1 then raise exception 'second version overwrote history'; end if;
end;$$;
select public.accept_daily_word_card((select id from reclaimed), 'discern');
do $$begin
  if (select content->>'hook' from public.personal_word_card_versions where is_active) <> '找不同，仔细看才辨出差别' then raise exception 'earlier version cannot be restored'; end if;
end;$$;
reset role;
select 'PASS: idempotency, webhook, cron, leases, stale result rejection, retries, card rollback, RLS';
