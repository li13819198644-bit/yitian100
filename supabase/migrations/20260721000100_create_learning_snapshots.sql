create table if not exists public.learning_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.learning_snapshots enable row level security;

drop policy if exists "Users can read own learning snapshot" on public.learning_snapshots;
create policy "Users can read own learning snapshot"
on public.learning_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning snapshot" on public.learning_snapshots;
create policy "Users can insert own learning snapshot"
on public.learning_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own learning snapshot" on public.learning_snapshots;
create policy "Users can update own learning snapshot"
on public.learning_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

