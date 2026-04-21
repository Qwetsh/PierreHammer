-- Army Lists table
create table army_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  faction_id text not null,
  detachment text not null,
  detachment_id text,
  points_limit int not null check (points_limit in (1000, 2000, 3000)),
  units jsonb not null default '[]',
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_army_lists_user_id on army_lists(user_id);
create index idx_army_lists_is_public on army_lists(is_public) where is_public = true;

-- RLS
alter table army_lists enable row level security;

-- Users can read their own lists
create policy "Users can read own lists"
  on army_lists for select
  using (auth.uid() = user_id);

-- Users can read public lists
create policy "Anyone can read public lists"
  on army_lists for select
  using (is_public = true);

-- Users can insert their own lists
create policy "Users can insert own lists"
  on army_lists for insert
  with check (auth.uid() = user_id);

-- Users can update their own lists
create policy "Users can update own lists"
  on army_lists for update
  using (auth.uid() = user_id);

-- Users can delete their own lists
create policy "Users can delete own lists"
  on army_lists for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger army_lists_updated_at
  before update on army_lists
  for each row execute function update_updated_at_column();
