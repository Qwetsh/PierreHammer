import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('army_lists migration SQL', () => {
  const sql = readFileSync(
    resolve(__dirname, '20260421_create_army_lists.sql'),
    'utf-8',
  )

  it('creates the army_lists table', () => {
    expect(sql).toContain('create table army_lists')
  })

  it('has RLS enabled', () => {
    expect(sql).toContain('enable row level security')
  })

  it('has policies for select, insert, update, delete', () => {
    expect(sql).toContain('for select')
    expect(sql).toContain('for insert')
    expect(sql).toContain('for update')
    expect(sql).toContain('for delete')
  })

  it('has a public lists policy', () => {
    expect(sql).toContain('is_public = true')
  })

  it('has indexes on user_id and is_public', () => {
    expect(sql).toContain('idx_army_lists_user_id')
    expect(sql).toContain('idx_army_lists_is_public')
  })

  it('has updated_at trigger', () => {
    expect(sql).toContain('army_lists_updated_at')
    expect(sql).toContain('update_updated_at_column')
  })
})
