import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('profiles and friendships migration SQL', () => {
  const sql = readFileSync(
    resolve(__dirname, '20260421_create_profiles_and_friendships.sql'),
    'utf-8',
  )

  it('creates the profiles table', () => {
    expect(sql).toContain('create table profiles')
    expect(sql).toContain('references auth.users(id)')
    expect(sql).toContain('username text unique')
  })

  it('creates auto-profile trigger on auth.users', () => {
    expect(sql).toContain('handle_new_user')
    expect(sql).toContain('after insert on auth.users')
    expect(sql).toContain('insert into profiles (id) values (new.id)')
  })

  it('has RLS enabled on profiles', () => {
    expect(sql).toContain('alter table profiles enable row level security')
  })

  it('has profiles select and update policies', () => {
    expect(sql).toContain('profiles_select_authenticated')
    expect(sql).toContain('profiles_update_own')
  })

  it('creates the friendships table with status constraint', () => {
    expect(sql).toContain('create table friendships')
    expect(sql).toContain("check (status in ('pending', 'accepted', 'rejected'))")
    expect(sql).toContain('unique(requester_id, addressee_id)')
  })

  it('has RLS enabled on friendships', () => {
    expect(sql).toContain('alter table friendships enable row level security')
  })

  it('has friendships policies for select, insert, update, delete', () => {
    expect(sql).toContain('friendships_select_own')
    expect(sql).toContain('friendships_insert_as_requester')
    expect(sql).toContain('friendships_update_own')
    expect(sql).toContain('friendships_delete_own')
  })

  it('has indexes for friendship lookups', () => {
    expect(sql).toContain('idx_friendships_requester')
    expect(sql).toContain('idx_friendships_addressee')
    expect(sql).toContain('idx_friendships_status')
  })

  it('RLS ensures users only see their own friendships', () => {
    expect(sql).toContain('auth.uid() = requester_id or auth.uid() = addressee_id')
  })

  it('RLS ensures only requester can insert', () => {
    expect(sql).toContain('auth.uid() = requester_id')
  })
})
