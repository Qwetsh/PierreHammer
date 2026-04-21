import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface CasualtyRecord {
  id?: string
  session_id: string
  player_id: string
  list_unit_id: string
  models_destroyed: number
  wounds_remaining: number | null
}

export async function upsertCasualty(record: Omit<CasualtyRecord, 'id'>): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('unit_casualties')
      .upsert(record, { onConflict: 'session_id,player_id,list_unit_id' })
    if (error) {
      console.error('upsertCasualty error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('upsertCasualty exception:', e)
    return false
  }
}

export async function getCasualties(sessionId: string): Promise<CasualtyRecord[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase
      .from('unit_casualties')
      .select('*')
      .eq('session_id', sessionId)
    if (error) {
      console.error('getCasualties error:', error.message)
      return []
    }
    return data as CasualtyRecord[]
  } catch (e) {
    console.error('getCasualties exception:', e)
    return []
  }
}

export async function resetCasualty(sessionId: string, playerId: string, listUnitId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('unit_casualties')
      .delete()
      .eq('session_id', sessionId)
      .eq('player_id', playerId)
      .eq('list_unit_id', listUnitId)
    if (error) {
      console.error('resetCasualty error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('resetCasualty exception:', e)
    return false
  }
}

type RealtimeCallback = (payload: { new: CasualtyRecord }) => void
type UnsubscribeFn = () => void

export function subscribeToCasualties(sessionId: string, callback: RealtimeCallback): UnsubscribeFn {
  if (!isSupabaseConfigured || !supabase) return () => {}

  const channel = supabase
    .channel(`casualties:${sessionId}`)
    .on(
      'postgres_changes' as never,
      {
        event: '*',
        schema: 'public',
        table: 'unit_casualties',
        filter: `session_id=eq.${sessionId}`,
      },
      callback as never,
    )
    .subscribe()

  return () => {
    supabase!.removeChannel(channel)
  }
}
