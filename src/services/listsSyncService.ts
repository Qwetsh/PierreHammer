import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ArmyList, ListUnit, PointsLimit } from '@/types/armyList.types'

interface RemoteArmyList {
  id: string
  user_id: string
  name: string
  faction_id: string
  detachment: string
  detachment_id: string | null
  points_limit: number
  units: ListUnit[]
  is_public: boolean
  created_at: string
  updated_at: string
}

function toLocal(remote: RemoteArmyList): ArmyList & { remoteId: string; isPublic: boolean } {
  return {
    id: remote.id,
    remoteId: remote.id,
    name: remote.name,
    factionId: remote.faction_id,
    detachment: remote.detachment,
    detachmentId: remote.detachment_id ?? undefined,
    pointsLimit: remote.points_limit as PointsLimit,
    units: remote.units ?? [],
    createdAt: new Date(remote.created_at).getTime(),
    isPublic: remote.is_public,
  }
}

function toRemote(
  local: ArmyList,
  userId: string,
  isPublic = false,
): Omit<RemoteArmyList, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    name: local.name,
    faction_id: local.factionId,
    detachment: local.detachment,
    detachment_id: local.detachmentId ?? null,
    points_limit: local.pointsLimit,
    units: local.units,
    is_public: isPublic,
  }
}

export async function fetchRemoteLists(userId: string): Promise<(ArmyList & { remoteId: string; isPublic: boolean })[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase
      .from('army_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('fetchRemoteLists error:', error.message)
      return []
    }
    return (data as RemoteArmyList[]).map(toLocal)
  } catch (e) {
    console.error('fetchRemoteLists exception:', e)
    return []
  }
}

export async function fetchPublicLists(userId: string): Promise<(ArmyList & { remoteId: string; isPublic: boolean })[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase
      .from('army_lists')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('fetchPublicLists error:', error.message)
      return []
    }
    return (data as RemoteArmyList[]).map(toLocal)
  } catch (e) {
    console.error('fetchPublicLists exception:', e)
    return []
  }
}

export async function pushList(
  list: ArmyList,
  userId: string,
  isPublic = false,
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('army_lists')
      .insert(toRemote(list, userId, isPublic))
      .select('id')
      .single()
    if (error) {
      console.error('pushList error:', error.message)
      return null
    }
    return data.id
  } catch (e) {
    console.error('pushList exception:', e)
    return null
  }
}

export async function updateRemoteList(
  remoteId: string,
  list: ArmyList,
  userId: string,
  isPublic?: boolean,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const payload = toRemote(list, userId, isPublic)
    const { error } = await supabase
      .from('army_lists')
      .update(payload)
      .eq('id', remoteId)
    if (error) {
      console.error('updateRemoteList error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('updateRemoteList exception:', e)
    return false
  }
}

export async function deleteRemoteList(remoteId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('army_lists')
      .delete()
      .eq('id', remoteId)
    if (error) {
      console.error('deleteRemoteList error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('deleteRemoteList exception:', e)
    return false
  }
}

export async function setListPublic(remoteId: string, isPublic: boolean): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('army_lists')
      .update({ is_public: isPublic })
      .eq('id', remoteId)
    if (error) {
      console.error('setListPublic error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('setListPublic exception:', e)
    return false
  }
}
