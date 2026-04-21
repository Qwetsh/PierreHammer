-- Profiles: extends auth.users with a public username
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS on profiles
alter table profiles enable row level security;

-- Anyone authenticated can read profiles (needed for search)
create policy "profiles_select_authenticated"
  on profiles for select
  using (auth.role() = 'authenticated');

-- Users can only update their own profile
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Index for username search
create index idx_profiles_username on profiles (lower(username));

-- Friendships
create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- RLS on friendships
alter table friendships enable row level security;

-- Users can see friendships where they are requester or addressee
create policy "friendships_select_own"
  on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Users can insert friendships only as requester
create policy "friendships_insert_as_requester"
  on friendships for insert
  with check (auth.uid() = requester_id);

-- Addressee can update (accept/reject); requester can also update (cancel)
create policy "friendships_update_own"
  on friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Either party can delete (unfriend)
create policy "friendships_delete_own"
  on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Indexes for friendship lookups
create index idx_friendships_requester on friendships (requester_id);
create index idx_friendships_addressee on friendships (addressee_id);
create index idx_friendships_status on friendships (status) where status = 'pending';
