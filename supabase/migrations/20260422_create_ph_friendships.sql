-- PierreHammer dedicated friendships table (separate from shared friendships)
create table if not exists ph_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- RLS
alter table ph_friendships enable row level security;

create policy "ph_friendships_select_own"
  on ph_friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "ph_friendships_insert_as_requester"
  on ph_friendships for insert
  with check (auth.uid() = requester_id);

create policy "ph_friendships_update_own"
  on ph_friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "ph_friendships_delete_own"
  on ph_friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Indexes
create index idx_ph_friendships_requester on ph_friendships (requester_id);
create index idx_ph_friendships_addressee on ph_friendships (addressee_id);
create index idx_ph_friendships_status on ph_friendships (status) where status = 'pending';
