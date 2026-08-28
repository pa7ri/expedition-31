-- Expedition 31 — Supabase schema.
-- Run this in the Supabase SQL editor (Project → SQL → New query) once per project.
-- Safe to re-run: it drops and recreates the game tables.

-- ── Enums ─────────────────────────────────────────────────────────────────
do $$ begin
  create type element as enum ('FIRE','WATER','EARTH','AIR');
exception when duplicate_object then null; end $$;

do $$ begin
  create type phase as enum ('SETUP','BAR_1','TRANSITION','BAR_2','FINAL','ENDED');
exception when duplicate_object then null; end $$;

-- ── Tables ────────────────────────────────────────────────────────────────
create table if not exists players (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  element       element not null,
  score         integer not null default 100,
  frozen        boolean not null default false,
  session_token text not null unique,
  created_at    timestamptz not null default now()
);

create table if not exists tags (
  code    text primary key,
  type    text not null,
  title   text not null,
  active  boolean not null default true
);

create table if not exists scans (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  tag_code   text not null references tags(code) on delete cascade,
  result     jsonb,
  created_at timestamptz not null default now()
);
-- One scan per player per tag (group/alliance tags insert their own rows but the
-- app checks type before enforcing; the constraint stops repeat-farming of single tags).
create unique index if not exists scans_player_tag_unique on scans(player_id, tag_code);

create table if not exists inventory (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  artifact      text not null,
  used          boolean not null default false,
  shield_active boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (player_id, artifact)
);

create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  type          text not null,
  source_player uuid references players(id) on delete set null,
  target_player uuid references players(id) on delete set null,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists group_sessions (
  id         uuid primary key default gen_random_uuid(),
  tag_code   text not null references tags(code) on delete cascade,
  opened_at  timestamptz not null default now(),
  expires_at timestamptz not null,
  members    jsonb not null default '[]'::jsonb, -- [{player_id, element, name}]
  resolved   boolean not null default false
);

create table if not exists game_state (
  id    integer primary key default 1,
  phase phase not null default 'SETUP',
  constraint game_state_singleton check (id = 1)
);
insert into game_state (id, phase) values (1, 'SETUP') on conflict (id) do nothing;

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Light posture (friendly party): the anon key may read and write game rows.
-- The unique scan index, phase gating in the app, and the admin panel are the guardrails.
alter table players        enable row level security;
alter table tags           enable row level security;
alter table scans          enable row level security;
alter table inventory      enable row level security;
alter table events         enable row level security;
alter table group_sessions enable row level security;
alter table game_state     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['players','tags','scans','inventory','events','group_sessions','game_state']
  loop
    execute format('drop policy if exists anon_all on %I;', t);
    execute format('create policy anon_all on %I for all to anon using (true) with check (true);', t);
  end loop;
end $$;
