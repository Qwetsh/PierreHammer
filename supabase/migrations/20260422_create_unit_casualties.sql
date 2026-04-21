-- Unit casualties tracking for game sessions
create table unit_casualties (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references game_sessions(id) on delete cascade not null,
  player_id uuid references profiles(id) on delete cascade not null,
  list_unit_id text not null,
  models_destroyed int not null default 0,
  wounds_remaining int,
  updated_at timestamptz default now(),
  unique(session_id, player_id, list_unit_id)
);

-- Indexes
create index idx_unit_casualties_session on unit_casualties(session_id);
create index idx_unit_casualties_player on unit_casualties(player_id);

-- RLS
alter table unit_casualties enable row level security;

-- Both players of the session can read casualties
create policy "Session players can read casualties"
  on unit_casualties for select
  using (
    exists (
      select 1 from game_sessions gs
      where gs.id = unit_casualties.session_id
        and (gs.player1_id = auth.uid() or gs.player2_id = auth.uid())
    )
  );

-- Both players of the session can insert casualties
create policy "Session players can insert casualties"
  on unit_casualties for insert
  with check (
    exists (
      select 1 from game_sessions gs
      where gs.id = unit_casualties.session_id
        and (gs.player1_id = auth.uid() or gs.player2_id = auth.uid())
    )
  );

-- Both players of the session can update casualties
create policy "Session players can update casualties"
  on unit_casualties for update
  using (
    exists (
      select 1 from game_sessions gs
      where gs.id = unit_casualties.session_id
        and (gs.player1_id = auth.uid() or gs.player2_id = auth.uid())
    )
  );

-- Both players can delete casualties
create policy "Session players can delete casualties"
  on unit_casualties for delete
  using (
    exists (
      select 1 from game_sessions gs
      where gs.id = unit_casualties.session_id
        and (gs.player1_id = auth.uid() or gs.player2_id = auth.uid())
    )
  );

-- Auto-update updated_at
create trigger unit_casualties_updated_at
  before update on unit_casualties
  for each row execute function update_updated_at_column();

-- Enable Realtime for this table
alter publication supabase_realtime add table unit_casualties;
