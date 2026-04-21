import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('ph_friendships migration SQL', () => {
  const sql = readFileSync(
    resolve(__dirname, '20260422_create_ph_friendships.sql'),
    'utf-8',
  )

  it('creates the ph_friendships table with status constraint', () => {
    expect(sql).toContain('create table if not exists ph_friendships')
    expect(sql).toContain("check (status in ('pending', 'accepted', 'rejected'))")
    expect(sql).toContain('unique(requester_id, addressee_id)')
  })

  it('has RLS enabled', () => {
    expect(sql).toContain('alter table ph_friendships enable row level security')
  })

  it('has policies for select, insert, update, delete', () => {
    expect(sql).toContain('ph_friendships_select_own')
    expect(sql).toContain('ph_friendships_insert_as_requester')
    expect(sql).toContain('ph_friendships_update_own')
    expect(sql).toContain('ph_friendships_delete_own')
  })

  it('has indexes for lookups', () => {
    expect(sql).toContain('idx_ph_friendships_requester')
    expect(sql).toContain('idx_ph_friendships_addressee')
    expect(sql).toContain('idx_ph_friendships_status')
  })
})
