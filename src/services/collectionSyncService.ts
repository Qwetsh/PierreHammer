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
      console.error('[collection-sync] fetch error:', error.message)
      return {}
    }
    const items: Record<string, CollectionItem> = {}
    for (const row of data as RemoteCollectionItem[]) {
      items[row.datasheet_id] = toLocal(row)
    }
    return items
  } catch (e) {
    console.error('[collection-sync] fetch exception:', e)
    return {}
  }
}

export async function upsertCollectionItem(item: CollectionItem, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const payload = toRemote(item, userId)
    console.log('[collection-sync] upsert:', payload.datasheet_id)
    const { error } = await supabase
      .from('ph_collection_items')
      .upsert(payload, { onConflict: 'user_id,datasheet_id' })
    if (error) {
      console.error('[collection-sync] upsert error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('[collection-sync] upsert exception:', e)
    return false
  }
}

export async function deleteCollectionItem(userId: string, datasheetId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    console.log('[collection-sync] delete:', datasheetId)
    const { error } = await supabase
      .from('ph_collection_items')
      .delete()
      .eq('user_id', userId)
      .eq('datasheet_id', datasheetId)
    if (error) {
      console.error('[collection-sync] delete error:', error.message)
      return false
    }
    console.log('[collection-sync] delete OK:', datasheetId)
    return true
  } catch (e) {
    console.error('[collection-sync] delete exception:', e)
    return false
  }
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

  console.log('[collection-sync] subscribing to realtime')
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
      ((payload: { eventType: string; new: RemoteCollectionItem; old: Record<string, string> }) => {
        console.log('[collection-sync] realtime event:', payload.eventType, payload)
        if (payload.eventType === 'DELETE') {
          const dsId = payload.old?.datasheet_id
          if (dsId) callback('delete', null, dsId)
        } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new?.datasheet_id) {
            callback('upsert', toLocal(payload.new), payload.new.datasheet_id)
          }
        }
      }) as never,
    )
    .subscribe()

  return () => {
    supabase!.removeChannel(channel)
  }
}
