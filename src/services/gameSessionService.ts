import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface GameSession {
  id: string
  player1_id: string
  player2_id: string
  player1_list_id: string
  player2_list_id: string
  status: 'pending' | 'active' | 'completed' | 'abandoned' | 'declined'
  created_at: string
  updated_at: string
}

export async function createSession(
  player1Id: string,
  player1ListId: string,
  player2Id: string,
  player2ListId: string,
): Promise<GameSession | null> {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        player1_id: player1Id,
        player2_id: player2Id,
        player1_list_id: player1ListId,
        player2_list_id: player2ListId,
        status: 'pending',
      })
      .select('*')
      .single()
    if (error) {
      console.error('createSession error:', error.message)
      return null
    }
    return data as GameSession
  } catch (e) {
    console.error('createSession exception:', e)
    return null
  }
}

export async function acceptSession(sessionId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('game_sessions')
      .update({ status: 'active' })
      .eq('id', sessionId)
      .eq('status', 'pending')
    if (error) {
      console.error('acceptSession error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('acceptSession exception:', e)
    return false
  }
}

export async function declineSession(sessionId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('game_sessions')
      .update({ status: 'declined' })
      .eq('id', sessionId)
      .eq('status', 'pending')
    if (error) {
      console.error('declineSession error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('declineSession exception:', e)
    return false
  }
}

export async function getActiveSession(userId: string): Promise<GameSession | null> {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .in('status', ['active', 'pending'])
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error('getActiveSession error:', error.message)
      return null
    }
    return data as GameSession | null
  } catch (e) {
    console.error('getActiveSession exception:', e)
    return null
  }
}

export async function endSession(sessionId: string, status: 'completed' | 'abandoned'): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const { error } = await supabase
      .from('game_sessions')
      .update({ status })
      .eq('id', sessionId)
    if (error) {
      console.error('endSession error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('endSession exception:', e)
    return false
  }
}

type SessionRealtimeCallback = (payload: { new: GameSession; old: GameSession | null; eventType: string }) => void

export function subscribeToSessionChanges(sessionId: string, callback: SessionRealtimeCallback): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {}
  const channel = supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes' as never,
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`,
      },
      ((payload: { new: GameSession; old: GameSession | null; eventType: string }) => callback(payload)) as never,
    )
    .subscribe()
  return () => { supabase!.removeChannel(channel) }
}

export function subscribeToIncomingInvites(userId: string, callback: (session: GameSession) => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {}
  const channel = supabase
    .channel(`invites:${userId}`)
    .on(
      'postgres_changes' as never,
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_sessions',
        filter: `player2_id=eq.${userId}`,
      },
      ((payload: { new: GameSession }) => {
        if (payload.new.status === 'pending') {
          callback(payload.new)
        }
      }) as never,
    )
    .subscribe()
  return () => { supabase!.removeChannel(channel) }
}
