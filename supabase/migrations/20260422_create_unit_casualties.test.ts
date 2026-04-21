import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('unit_casualties migration SQL', () => {
  const sql = readFileSync(
    resolve(__dirname, '20260422_create_unit_casualties.sql'),
    'utf-8',
  )

  it('creates the unit_casualties table', () => {
    expect(sql).toContain('create table unit_casualties')
    expect(sql).toContain('id uuid primary key default gen_random_uuid()')
  })

  it('references game_sessions and profiles', () => {
    expect(sql).toContain('session_id uuid references game_sessions(id) on delete cascade')
    expect(sql).toContain('player_id uuid references profiles(id) on delete cascade')
  })

  it('has list_unit_id and casualty fields', () => {
    expect(sql).toContain('list_unit_id text not null')
    expect(sql).toContain('models_destroyed int not null default 0')
    expect(sql).toContain('wounds_remaining int')
  })

  it('has unique constraint on session+player+unit', () => {
    expect(sql).toContain('unique(session_id, player_id, list_unit_id)')
  })

  it('has RLS enabled', () => {
    expect(sql).toContain('alter table unit_casualties enable row level security')
  })

  it('RLS policies use game_sessions join for access control', () => {
    expect(sql).toContain('game_sessions gs')
    expect(sql).toContain('gs.player1_id = auth.uid() or gs.player2_id = auth.uid()')
  })

  it('has CRUD policies', () => {
    expect(sql).toContain('for select')
    expect(sql).toContain('for insert')
    expect(sql).toContain('for update')
    expect(sql).toContain('for delete')
  })

  it('has indexes', () => {
    expect(sql).toContain('idx_unit_casualties_session')
    expect(sql).toContain('idx_unit_casualties_player')
  })

  it('has updated_at trigger', () => {
    expect(sql).toContain('unit_casualties_updated_at')
  })

  it('enables Realtime', () => {
    expect(sql).toContain('supabase_realtime add table unit_casualties')
  })
})
