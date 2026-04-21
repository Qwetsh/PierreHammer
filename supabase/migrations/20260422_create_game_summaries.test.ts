import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('game_summaries migration SQL', () => {
  const sql = readFileSync(
    resolve(__dirname, '20260422_create_game_summaries.sql'),
    'utf-8',
  )

  it('creates the game_summaries table', () => {
    expect(sql).toContain('create table if not exists game_summaries')
    expect(sql).toContain('id uuid primary key default gen_random_uuid()')
  })

  it('references game_sessions', () => {
    expect(sql).toContain('session_id uuid references game_sessions(id) on delete cascade')
  })

  it('references profiles for both players', () => {
    expect(sql).toContain('player1_id uuid references profiles(id)')
    expect(sql).toContain('player2_id uuid references profiles(id)')
  })

  it('has faction and detachment columns', () => {
    expect(sql).toContain('player1_faction text')
    expect(sql).toContain('player2_faction text')
    expect(sql).toContain('player1_detachment text')
    expect(sql).toContain('player2_detachment text')
  })

  it('has stat columns', () => {
    expect(sql).toContain('duration_minutes int')
    expect(sql).toContain('player1_units_destroyed int')
    expect(sql).toContain('player2_units_destroyed int')
    expect(sql).toContain('player1_models_destroyed int')
    expect(sql).toContain('player2_models_destroyed int')
  })

  it('has indexes on player ids', () => {
    expect(sql).toContain('idx_game_summaries_player1')
    expect(sql).toContain('idx_game_summaries_player2')
  })

  it('enables RLS with read policy', () => {
    expect(sql).toContain('enable row level security')
    expect(sql).toContain('Players can read their summaries')
    expect(sql).toContain('for select')
  })

  it('has insert policy', () => {
    expect(sql).toContain('for insert')
    expect(sql).toContain('auth.uid() = player1_id or auth.uid() = player2_id')
  })
})
