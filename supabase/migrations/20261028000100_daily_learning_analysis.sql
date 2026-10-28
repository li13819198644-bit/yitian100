create extension if not exists pgcrypto with schema extensions;

create table if not exists public.daily_learning_reports (
  user_id uuid not null references auth.users(id) on delete cascade,
  report_date date not null,
  time_zone text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 1000000),
  content_hash text not null,
  revision integer not null default 1 check (revision > 0),
  uploaded_at timestamptz not null default now(),
  primary key (user_id, report_date)
);

create table if not exists public.daily_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  report_date date not null,
  revision integer not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'superseded')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz,
  result jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, report_date) references public.daily_learning_reports(user_id, report_date) on delete cascade,
  unique (user_id, report_date, revision)
);
create index if not exists daily_analysis_pending on public.daily_analysis_jobs(status, next_attempt_at);

create table if not exists public.personal_word_card_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null,
  job_id uuid not null references public.daily_analysis_jobs(id) on delete cascade,
  content jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, word_id, job_id)
);
create unique index if not exists one_active_personal_word_card on public.personal_word_card_versions(user_id, word_id) where is_active;

alter table public.daily_learning_reports enable row level security;
alter table public.daily_analysis_jobs enable row level security;
alter table public.personal_word_card_versions enable row level security;
create policy "Read own daily reports" on public.daily_learning_reports for select to authenticated using (auth.uid() = user_id);
create policy "Read own analysis jobs" on public.daily_analysis_jobs for select to authenticated using (auth.uid() = user_id);
create policy "Read own personal card versions" on public.personal_word_card_versions for select to authenticated using (auth.uid() = user_id);
revoke all on public.daily_learning_reports, public.daily_analysis_jobs, public.personal_word_card_versions from anon, authenticated;
grant select on public.daily_learning_reports, public.daily_analysis_jobs, public.personal_word_card_versions to authenticated;
grant all on public.daily_learning_reports, public.daily_analysis_jobs, public.personal_word_card_versions to service_role;

create or replace view public.latest_daily_analysis_jobs with (security_invoker = true) as
  select j.id, j.user_id, j.report_date, j.revision, j.status, j.result, j.created_at, j.updated_at
  from public.daily_analysis_jobs j join public.daily_learning_reports r
    on r.user_id = j.user_id and r.report_date = j.report_date and r.revision = j.revision;
grant select on public.latest_daily_analysis_jobs to authenticated, service_role;

-- One owner/date row, stable server-side fingerprint, serialized revisions across devices.
create or replace function public.upload_daily_learning_report(p_payload jsonb)
returns public.daily_analysis_jobs
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  day date;
  zone text := p_payload->>'timeZone';
  fingerprint text;
  report public.daily_learning_reports;
  job public.daily_analysis_jobs;
begin
  if owner_id is null then raise exception 'login_required'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text) > 1000000
    or p_payload->>'schemaVersion' is distinct from '1'
    or coalesce(p_payload->>'date', '') !~ '^\d{4}-\d{2}-\d{2}$'
    or not exists (select 1 from pg_catalog.pg_timezone_names where name = zone)
    or jsonb_typeof(p_payload#>'{vocabulary,results}') is distinct from 'array'
  then raise exception 'invalid_daily_report'; end if;
  day := (p_payload->>'date')::date;
  if day > (now() at time zone zone)::date or day < (now() at time zone zone)::date - 90 then raise exception 'invalid_report_date'; end if;
  if jsonb_array_length(p_payload#>'{vocabulary,results}') > 1000 then raise exception 'invalid_daily_report'; end if;
  fingerprint := encode(extensions.digest(p_payload::text, 'sha256'), 'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text || '/' || day::text, 0));
  select * into report from public.daily_learning_reports where user_id = owner_id and report_date = day;
  if not found then
    insert into public.daily_learning_reports(user_id, report_date, time_zone, payload, content_hash)
      values (owner_id, day, zone, p_payload, fingerprint) returning * into report;
  elsif report.content_hash <> fingerprint then
    update public.daily_learning_reports set payload = p_payload, time_zone = zone, content_hash = fingerprint,
      revision = revision + 1, uploaded_at = now()
      where user_id = owner_id and report_date = day returning * into report;
    update public.daily_analysis_jobs set status = 'superseded', lease_token = null, lease_until = null, updated_at = now()
      where user_id = owner_id and report_date = day and status in ('pending', 'processing', 'failed');
  end if;
  insert into public.daily_analysis_jobs(user_id, report_date, revision) values (owner_id, day, report.revision)
    on conflict (user_id, report_date, revision) do nothing;
  select * into job from public.daily_analysis_jobs where user_id = owner_id and report_date = day and revision = report.revision;
  -- A deliberate retry of unchanged failed input reuses the job rather than another report.
  if job.status = 'failed' then
    update public.daily_analysis_jobs set status = 'pending', attempts = 0, next_attempt_at = now(), error_code = null, updated_at = now()
      where id = job.id returning * into job;
  end if;
  return job;
end;
$$;

create or replace function public.claim_daily_analysis_job(p_job_id uuid default null)
returns setof public.daily_analysis_jobs
language plpgsql security definer set search_path = '' as $$
begin
  update public.daily_analysis_jobs set status = 'failed', error_code = 'analysis_failed', lease_token = null, lease_until = null, updated_at = now()
    where status = 'processing' and lease_until < now() and attempts >= 5;
  return query
  with candidate as (
    select j.id from public.daily_analysis_jobs j
    join public.daily_learning_reports r on r.user_id = j.user_id and r.report_date = j.report_date and r.revision = j.revision
    where (p_job_id is null or j.id = p_job_id) and j.attempts < 5
      and ((j.status in ('pending', 'failed') and j.next_attempt_at <= now()) or (j.status = 'processing' and j.lease_until < now()))
    order by j.created_at for update of j skip locked limit 1
  )
  update public.daily_analysis_jobs j set status = 'processing', attempts = attempts + 1,
    lease_token = gen_random_uuid(), lease_until = now() + interval '3 minutes', updated_at = now()
    from candidate c where j.id = c.id returning j.*;
end;
$$;

create or replace function public.finish_daily_analysis_job(p_job_id uuid, p_lease_token uuid, p_result jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  if p_result->>'schemaVersion' is distinct from '1' or jsonb_typeof(p_result->'cardDrafts') is distinct from 'array' then raise exception 'invalid_analysis'; end if;
  update public.daily_analysis_jobs j set status = 'completed', result = p_result, error_code = null,
    lease_token = null, lease_until = null, updated_at = now()
    where j.id = p_job_id and j.lease_token = p_lease_token and j.status = 'processing' and j.lease_until > now()
      and exists (select 1 from public.daily_learning_reports r where r.user_id = j.user_id and r.report_date = j.report_date and r.revision = j.revision);
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

create or replace function public.fail_daily_analysis_job(p_job_id uuid, p_lease_token uuid)
returns void language sql security definer set search_path = '' as $$
  update public.daily_analysis_jobs set status = 'failed', error_code = 'analysis_failed',
    lease_token = null, lease_until = null, next_attempt_at = now() + attempts * interval '5 minutes', updated_at = now()
    where id = p_job_id and lease_token = p_lease_token and status = 'processing';
$$;

create or replace function public.accept_daily_word_card(p_job_id uuid, p_word_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare draft jsonb; owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'login_required'; end if;
  select d into draft from public.daily_analysis_jobs j,
    lateral jsonb_array_elements(j.result->'cardDrafts') d
    where j.id = p_job_id and j.user_id = owner_id and j.status = 'completed' and d->>'wordId' = p_word_id;
  if draft is null then raise exception 'draft_not_found'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text || '/card/' || p_word_id, 0));
  update public.personal_word_card_versions set is_active = false where user_id = owner_id and word_id = p_word_id and is_active;
  insert into public.personal_word_card_versions(user_id, word_id, job_id, content)
    values (owner_id, p_word_id, p_job_id, draft)
    on conflict (user_id, word_id, job_id) do update set is_active = true;
end;
$$;

create or replace function public.restore_original_word_card(p_word_id text)
returns void language sql security definer set search_path = '' as $$
  update public.personal_word_card_versions set is_active = false where user_id = auth.uid() and word_id = p_word_id;
$$;

revoke all on function public.upload_daily_learning_report(jsonb), public.accept_daily_word_card(uuid, text), public.restore_original_word_card(text) from public, anon;
grant execute on function public.upload_daily_learning_report(jsonb), public.accept_daily_word_card(uuid, text), public.restore_original_word_card(text) to authenticated;
revoke all on function public.claim_daily_analysis_job(uuid), public.finish_daily_analysis_job(uuid, uuid, jsonb), public.fail_daily_analysis_job(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_daily_analysis_job(uuid), public.finish_daily_analysis_job(uuid, uuid, jsonb), public.fail_daily_analysis_job(uuid, uuid) to service_role;
