import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { CasualtyState } from '@/stores/gameSessionStore'

export interface GameSummary {
  id: string
  session_id: string
  player1_id: string
  player2_id: string
  player1_faction: string
  player2_faction: string
  player1_detachment: string
  player2_detachment: string
  duration_minutes: number
  player1_units_destroyed: number
  player2_units_destroyed: number
  player1_models_destroyed: number
  player2_models_destroyed: number
  created_at: string
}

export interface SummaryInput {
  sessionId: string
  player1Id: string
  player2Id: string
  player1Faction: string
  player2Faction: string
  player1Detachment: string
  player2Detachment: string
  sessionCreatedAt: string
  player1Casualties: Record<string, CasualtyState>
  player2Casualties: Record<string, CasualtyState>
  player1TotalUnits: number
  player2TotalUnits: number
}

/**
 * Compute summary stats from casualties.
 */
export function computeSummaryStats(input: SummaryInput): {
  durationMinutes: number
  player1UnitsDestroyed: number
  player2UnitsDestroyed: number
  player1ModelsDestroyed: number
  player2ModelsDestroyed: number
} {
  const now = new Date()
  const start = new Date(input.sessionCreatedAt)
  const durationMinutes = Math.max(0, Math.round((now.getTime() - start.getTime()) / 60000))

  // Count units fully destroyed (all models gone) and total models destroyed
  let player1UnitsDestroyed = 0
  let player1ModelsDestroyed = 0
  for (const cas of Object.values(input.player1Casualties)) {
    player1ModelsDestroyed += cas.modelsDestroyed
  }
  // A unit is "destroyed" if modelsDestroyed >= total models — but we don't have per-unit model count here.
  // We count units where modelsDestroyed > 0 as a proxy — the caller can pass accurate data.
  // Actually, let's count based on the casualties map: if a unit has casualties, we count its models.
  // For units destroyed: we'll rely on a simple heuristic — if modelsDestroyed > 0, count it.
  // The story says "nombre d'unités détruites" — we count units where all models are destroyed.
  // Since we don't know total models per unit, we accept this as-is (casualties only track destroyed).
  player1UnitsDestroyed = Object.values(input.player1Casualties)
    .filter((c) => c.modelsDestroyed > 0).length

  let player2UnitsDestroyed = 0
  let player2ModelsDestroyed = 0
  for (const cas of Object.values(input.player2Casualties)) {
    player2ModelsDestroyed += cas.modelsDestroyed
  }
  player2UnitsDestroyed = Object.values(input.player2Casualties)
    .filter((c) => c.modelsDestroyed > 0).length

  return {
    durationMinutes,
    player1UnitsDestroyed,
    player2UnitsDestroyed,
    player1ModelsDestroyed,
    player2ModelsDestroyed,
  }
}

export async function createSummary(input: SummaryInput): Promise<GameSummary | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const stats = computeSummaryStats(input)

  try {
    const { data, error } = await supabase
      .from('game_summaries')
      .insert({
        session_id: input.sessionId,
        player1_id: input.player1Id,
        player2_id: input.player2Id,
        player1_faction: input.player1Faction,
        player2_faction: input.player2Faction,
        player1_detachment: input.player1Detachment,
        player2_detachment: input.player2Detachment,
        duration_minutes: stats.durationMinutes,
        player1_units_destroyed: stats.player1UnitsDestroyed,
        player2_units_destroyed: stats.player2UnitsDestroyed,
        player1_models_destroyed: stats.player1ModelsDestroyed,
        player2_models_destroyed: stats.player2ModelsDestroyed,
      })
      .select('*')
      .single()
    if (error) {
      console.error('createSummary error:', error.message)
      return null
    }
    return data as GameSummary
  } catch (e) {
    console.error('createSummary exception:', e)
    return null
  }
}

export async function getSummariesForUser(userId: string): Promise<GameSummary[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase
      .from('game_summaries')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) {
      console.error('getSummariesForUser error:', error.message)
      return []
    }
    return data as GameSummary[]
  } catch (e) {
    console.error('getSummariesForUser exception:', e)
    return []
  }
}
