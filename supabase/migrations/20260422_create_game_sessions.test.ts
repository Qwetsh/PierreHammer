import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('game_sessions migration SQL', () => {
  const sql = readFileSync(
    resolve(__dirname, '20260422_create_game_sessions.sql'),
    'utf-8',
  )

  it('creates the game_sessions table', () => {
    expect(sql).toContain('create table game_sessions')
    expect(sql).toContain('id uuid primary key default gen_random_uuid()')
  })

  it('references profiles for both players', () => {
    expect(sql).toContain('player1_id uuid references profiles(id) on delete cascade')
    expect(sql).toContain('player2_id uuid references profiles(id) on delete cascade')
  })

  it('references army_lists for both lists', () => {
    expect(sql).toContain('player1_list_id uuid references army_lists(id)')
    expect(sql).toContain('player2_list_id uuid references army_lists(id)')
  })

  it('has status constraint with valid values', () => {
    expect(sql).toContain("check (status in ('active', 'completed', 'abandoned'))")
    expect(sql).toContain("default 'active'")
  })

  it('has RLS enabled', () => {
    expect(sql).toContain('alter table game_sessions enable row level security')
  })

  it('has RLS policies for both players', () => {
    expect(sql).toContain('auth.uid() = player1_id or auth.uid() = player2_id')
  })

  it('only player1 can create sessions', () => {
    expect(sql).toContain('auth.uid() = player1_id')
    expect(sql).toContain('for insert')
  })

  it('has indexes on player ids and active status', () => {
    expect(sql).toContain('idx_game_sessions_player1')
    expect(sql).toContain('idx_game_sessions_player2')
    expect(sql).toContain('idx_game_sessions_active')
  })

  it('has updated_at trigger', () => {
    expect(sql).toContain('game_sessions_updated_at')
    expect(sql).toContain('update_updated_at_column()')
  })
})
