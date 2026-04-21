-- Game summaries table
create table if not exists game_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references game_sessions(id) on delete cascade,
  player1_id uuid references profiles(id),
  player2_id uuid references profiles(id),
  player1_faction text not null default '',
  player2_faction text not null default '',
  player1_detachment text not null default '',
  player2_detachment text not null default '',
  duration_minutes int not null default 0,
  player1_units_destroyed int not null default 0,
  player2_units_destroyed int not null default 0,
  player1_models_destroyed int not null default 0,
  player2_models_destroyed int not null default 0,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_game_summaries_player1 on game_summaries(player1_id);
create index if not exists idx_game_summaries_player2 on game_summaries(player2_id);
create index if not exists idx_game_summaries_session on game_summaries(session_id);

-- RLS
alter table game_summaries enable row level security;

create policy "Players can read their summaries"
  on game_summaries for select
  using (auth.uid() = player1_id or auth.uid() = player2_id);

create policy "Players can insert summaries for their sessions"
  on game_summaries for insert
  with check (auth.uid() = player1_id or auth.uid() = player2_id);
