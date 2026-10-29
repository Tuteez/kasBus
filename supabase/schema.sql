-- kasBus schema. Run once in Supabase Dashboard -> SQL Editor.
-- All access goes through the Next.js server using the service role key,
-- so RLS is enabled without policies (anon/public keys get no access).

create extension if not exists pgcrypto;

create table if not exists team (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

insert into team (name)
select 'kasBus'
where not exists (select 1 from team);

create table if not exists events (
  id text primary key,
  title text not null check (char_length(title) between 1 and 120),
  type text not null check (type in ('TRAINING', 'GAME')),
  date_time timestamptz not null,
  location text not null check (char_length(location) between 1 and 200),
  minimum_players integer not null check (minimum_players between 1 and 100),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists events_date_time_idx on events (date_time);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references events (id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 40),
  -- Case-insensitive identity so "Maksim" and "maksim" are the same player.
  player_key text generated always as (lower(player_name)) stored,
  response text not null check (response in ('YES', 'MAYBE', 'NO')),
  updated_at timestamptz not null default now(),
  unique (event_id, player_key)
);

create index if not exists attendance_event_id_idx on attendance (event_id);

alter table team enable row level security;
alter table events enable row level security;
alter table attendance enable row level security;
