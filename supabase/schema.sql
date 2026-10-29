-- kasBus schema. Run the whole file once in Supabase Dashboard -> SQL Editor.
-- Safe to re-run: every statement is idempotent.
--
-- All access goes through the Next.js server using the secret/service_role key.
-- RLS is enabled with no policies and anon/authenticated have no grants,
-- so the database cannot be reached directly from browsers.

create extension if not exists pgcrypto;

create table if not exists public.team (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

insert into public.team (name)
select 'kasBus'
where not exists (select 1 from public.team);

create table if not exists public.events (
  id text primary key,
  title text not null check (char_length(title) between 1 and 120),
  type text not null check (type in ('TRAINING', 'GAME')),
  date_time timestamptz not null,
  location text not null check (char_length(location) between 1 and 200),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

-- Status rules are built in (5 players), so the old per-event threshold is gone.
alter table public.events drop column if exists minimum_players;

create index if not exists events_date_time_idx on public.events (date_time);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 40),
  -- Case-insensitive identity so "Maksim" and "maksim" are the same player.
  player_key text generated always as (lower(player_name)) stored,
  response text not null check (response in ('YES', 'MAYBE', 'NO')),
  updated_at timestamptz not null default now(),
  -- Required by the app's upsert (onConflict: "event_id,player_key").
  constraint attendance_event_player_key unique (event_id, player_key)
);

-- Supports getKnownPlayers(), which orders all responses by recency.
create index if not exists attendance_updated_at_idx on public.attendance (updated_at desc);

alter table public.team enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;

-- Newer Supabase projects may not auto-expose new tables to the Data API,
-- so grant the server role explicitly and keep public roles locked out.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.team, public.events, public.attendance to service_role;
revoke all on public.team, public.events, public.attendance from anon, authenticated;

-- Make PostgREST pick up the new tables immediately.
notify pgrst, 'reload schema';
