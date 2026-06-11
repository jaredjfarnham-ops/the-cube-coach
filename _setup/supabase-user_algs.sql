-- Custom algorithms + preferred-algorithm choices, synced across devices.
-- Run this once in the Supabase SQL editor (same project as the `solves` table).
-- Safe to re-run. Until it exists, custom algorithms still work locally (per device);
-- this just adds cross-device sync.

create table if not exists public.user_algs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  set_id     text not null,           -- e.g. 'pll', 'coll', 'zbll-solved'
  case_name  text not null,           -- e.g. 'Ua', 'Sune', 'A3'
  alg        text not null,           -- the move sequence
  role       text not null default 'custom',  -- 'custom' (an added alg) or 'pref' (the chosen alg for a case)
  created_at timestamptz not null default now()
);

-- one row per (user, case, alg, role)
create unique index if not exists user_algs_uniq
  on public.user_algs (user_id, set_id, case_name, alg, role);

alter table public.user_algs enable row level security;

-- each user sees and edits only their own rows (drop-then-create so this script is re-runnable)
drop policy if exists "user_algs select" on public.user_algs;
drop policy if exists "user_algs insert" on public.user_algs;
drop policy if exists "user_algs update" on public.user_algs;
drop policy if exists "user_algs delete" on public.user_algs;
create policy "user_algs select" on public.user_algs for select using (auth.uid() = user_id);
create policy "user_algs insert" on public.user_algs for insert with check (auth.uid() = user_id);
create policy "user_algs update" on public.user_algs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_algs delete" on public.user_algs for delete using (auth.uid() = user_id);
