import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { CollectionItem } from '@/types/collection.types'
import type { PaintStatus } from '@/components/domain/PaintStatusBadge'

interface RemoteCollectionItem {
  id: string
  user_id: string
  datasheet_id: string
  faction_id: string
  instances: PaintStatus[]
  created_at: string
  updated_at: string
}

function toLocal(remote: RemoteCollectionItem): CollectionItem {
  return {
    datasheetId: remote.datasheet_id,
    factionId: remote.faction_id,
    instances: remote.instances ?? ['unassembled'],
  }
}

function toRemote(
  item: CollectionItem,
  userId: string,
): { user_id: string; datasheet_id: string; faction_id: string; instances: PaintStatus[] } {
  return {
    user_id: userId,
    datasheet_id: item.datasheetId,
    faction_id: item.factionId,
    instances: item.instances,
  }
}

export async function fetchRemoteCollection(userId: string): Promise<Record<string, CollectionItem>> {
  if (!isSupabaseConfigured || !supabase) return {}
  try {
    const { data, error } = await supabase
      .from('ph_collection_items')
      .select('*')
      .eq('user_id', userId)
    if (error) {
      console.error('fetchRemoteCollection error:', error.message)
      return {}
    }
    const items: Record<string, CollectionItem> = {}
    for (const row of data as RemoteCollectionItem[]) {
      items[row.datasheet_id] = toLocal(row)
    }
    return items
  } catch (e) {
    console.error('fetchRemoteCollection exception:', e)
    return {}
  }
}

export async function upsertCollectionItem(item: CollectionItem, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('ph_collection_items')
      .upsert(toRemote(item, userId), { onConflict: 'user_id,datasheet_id' })
    if (error) {
      console.error('upsertCollectionItem error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('upsertCollectionItem exception:', e)
    return false
  }
}

export async function deleteCollectionItem(userId: string, datasheetId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('ph_collection_items')
      .delete()
      .eq('user_id', userId)
      .eq('datasheet_id', datasheetId)
    if (error) {
      console.error('deleteCollectionItem error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('deleteCollectionItem exception:', e)
    return false
  }
}

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: RemoteCollectionItem
  old: { id: string; datasheet_id: string }
}

type CollectionChangeCallback = (
  event: 'upsert' | 'delete',
  item: CollectionItem | null,
  datasheetId: string,
) => void

export function subscribeToCollection(
  userId: string,
  callback: CollectionChangeCallback,
): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {}

  const channel = supabase
    .channel(`ph_collection:${userId}`)
    .on(
      'postgres_changes' as never,
      {
        event: '*',
        schema: 'public',
        table: 'ph_collection_items',
        filter: `user_id=eq.${userId}`,
      },
      ((payload: RealtimePayload) => {
        if (payload.eventType === 'DELETE') {
          callback('delete', null, payload.old.datasheet_id)
        } else {
          callback('upsert', toLocal(payload.new), payload.new.datasheet_id)
        }
      }) as never,
    )
    .subscribe()

  return () => {
    supabase!.removeChannel(channel)
  }
}

export async function pushFullCollection(
  items: Record<string, CollectionItem>,
  userId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const rows = Object.values(items).map((item) => toRemote(item, userId))
    if (rows.length === 0) return true
    const { error } = await supabase
      .from('ph_collection_items')
      .upsert(rows, { onConflict: 'user_id,datasheet_id' })
    if (error) {
      console.error('pushFullCollection error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('pushFullCollection exception:', e)
    return false
  }
}
