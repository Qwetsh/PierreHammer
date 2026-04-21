-- Game Sessions table
create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  player1_id uuid references profiles(id) on delete cascade not null,
  player2_id uuid references profiles(id) on delete cascade not null,
  player1_list_id uuid references army_lists(id),
  player2_list_id uuid references army_lists(id),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_game_sessions_player1 on game_sessions(player1_id);
create index idx_game_sessions_player2 on game_sessions(player2_id);
create index idx_game_sessions_active on game_sessions(status) where status = 'active';

-- RLS
alter table game_sessions enable row level security;

-- Both players can read their sessions
create policy "Players can read own sessions"
  on game_sessions for select
  using (auth.uid() = player1_id or auth.uid() = player2_id);

-- Only player1 (creator) can insert
create policy "Player can create sessions"
  on game_sessions for insert
  with check (auth.uid() = player1_id);

-- Both players can update their sessions
create policy "Players can update own sessions"
  on game_sessions for update
  using (auth.uid() = player1_id or auth.uid() = player2_id);

-- Both players can delete their sessions
create policy "Players can delete own sessions"
  on game_sessions for delete
  using (auth.uid() = player1_id or auth.uid() = player2_id);

-- Auto-update updated_at (reuse function from army_lists migration)
create trigger game_sessions_updated_at
  before update on game_sessions
  for each row execute function update_updated_at_column();
