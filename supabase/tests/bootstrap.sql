create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema extensions;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;$$;
grant usage on schema auth to authenticated, service_role;
grant execute on function auth.uid() to authenticated, service_role;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');

-- Only the extension boundaries are stubbed. These are not production secrets or HTTP calls.
create schema vault;
create table vault.decrypted_secrets(name text, decrypted_secret text);
insert into vault.decrypted_secrets values ('daily_analysis_function_url', 'https://example.test/worker'), ('daily_analysis_worker_secret', 'test-worker-secret');
create schema net;
create table net.requests(id bigint generated always as identity, endpoint text, headers jsonb, body jsonb);
create function net.http_post(url text, headers jsonb, body jsonb, timeout_milliseconds integer) returns bigint language sql as $$insert into net.requests(endpoint, headers, body) values(url, headers, body) returning id;$$;
create schema cron;
create table cron.jobs(name text, schedule text, command text);
create function cron.schedule(name text, schedule text, command text) returns bigint language sql as $$insert into cron.jobs values(name, schedule, command); select 1::bigint;$$;
