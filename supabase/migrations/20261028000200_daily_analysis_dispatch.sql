-- pg_net delivers committed events from the database; it does not depend on an open phone.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists supabase_vault with schema vault;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.dispatch_daily_analysis(p_job_id uuid default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare endpoint text; secret text; request_id bigint;
begin
  select decrypted_secret into endpoint from vault.decrypted_secrets where name = 'daily_analysis_function_url' limit 1;
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'daily_analysis_worker_secret' limit 1;
  if endpoint is null or secret is null then return null; end if;
  select net.http_post(
    url := endpoint,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-analysis-secret', secret),
    body := jsonb_build_object('job_id', p_job_id),
    timeout_milliseconds := 120000
  ) into request_id;
  return request_id;
exception when others then
  -- A dispatch failure must not roll back a saved report. The durable job is retried by cron.
  return null;
end;
$$;
revoke all on function private.dispatch_daily_analysis(uuid) from public, anon, authenticated;

create or replace function private.notify_daily_analysis()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'pending' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    perform private.dispatch_daily_analysis(new.id);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_daily_analysis() from public, anon, authenticated;
create trigger notify_daily_analysis after insert or update of status on public.daily_analysis_jobs
  for each row execute function private.notify_daily_analysis();

-- Retry missed/expired tasks every ten minutes, including overnight. No new data is fabricated.
select cron.schedule('daily-analysis-retry', '*/10 * * * *', $$select private.dispatch_daily_analysis();$$);
