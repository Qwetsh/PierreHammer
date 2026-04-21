import { create } from 'zustand'
import type { ArmyList } from '@/types/armyList.types'
import type { GameSession } from '@/services/gameSessionService'
import * as sessionService from '@/services/gameSessionService'
import * as casualtyService from '@/services/casualtySyncService'
import * as summaryService from '@/services/gameSummaryService'
import { fetchPublicLists } from '@/services/listsSyncService'
import { getProfile, type Profile } from '@/services/friendsService'
import { useGameDataStore } from './gameDataStore'

export interface CasualtyState {
  modelsDestroyed: number
  woundsRemaining: number | null
}

interface GameSessionState {
  activeSession: GameSession | null
  opponentProfile: Profile | null
  opponentList: ArmyList | null
  loading: boolean
  casualties: Record<string, CasualtyState>
  opponentCasualties: Record<string, CasualtyState>
  _unsubscribe: (() => void) | null

  startSession: (
    player1Id: string,
    player1ListId: string,
    player2Id: string,
    player2ListId: string,
  ) => Promise<boolean>
  loadSession: (userId: string) => Promise<void>
  endSession: (status: 'completed' | 'abandoned', summaryMeta?: { player1Faction: string; player2Faction: string; player1Detachment: string; player2Detachment: string }) => Promise<boolean>
  clearSession: () => void
  updateCasualty: (playerId: string, listUnitId: string, change: Partial<CasualtyState>) => void
  resetCasualty: (playerId: string, listUnitId: string) => void
  _applyCasualtyEvent: (record: casualtyService.CasualtyRecord, currentUserId: string) => void
}

// Debounce map for casualty updates
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  activeSession: null,
  opponentProfile: null,
  opponentList: null,
  loading: false,
  casualties: {},
  opponentCasualties: {},
  _unsubscribe: null,

  startSession: async (player1Id, player1ListId, player2Id, player2ListId) => {
    set({ loading: true })
    const session = await sessionService.createSession(player1Id, player1ListId, player2Id, player2ListId)
    if (!session) {
      set({ loading: false })
      return false
    }

    const profile = await getProfile(player2Id)
    const lists = await fetchPublicLists(player2Id)
    const list = lists.find((l) => l.remoteId === player2ListId) ?? null

    if (list) {
      useGameDataStore.getState().loadFaction(list.factionId)
    }

    // Subscribe to realtime casualties
    const unsub = casualtyService.subscribeToCasualties(session.id, (payload) => {
      get()._applyCasualtyEvent(payload.new, player1Id)
    })

    set({
      activeSession: session,
      opponentProfile: profile,
      opponentList: list,
      casualties: {},
      opponentCasualties: {},
      _unsubscribe: unsub,
      loading: false,
    })
    return true
  },

  loadSession: async (userId) => {
    set({ loading: true })
    const session = await sessionService.getActiveSession(userId)
    if (!session) {
      set({ activeSession: null, opponentProfile: null, opponentList: null, casualties: {}, opponentCasualties: {}, loading: false })
      return
    }

    const opponentId = session.player1_id === userId ? session.player2_id : session.player1_id
    const opponentListId = session.player1_id === userId ? session.player2_list_id : session.player1_list_id

    const profile = await getProfile(opponentId)
    const lists = await fetchPublicLists(opponentId)
    const list = lists.find((l) => l.remoteId === opponentListId) ?? null

    if (list) {
      useGameDataStore.getState().loadFaction(list.factionId)
    }

    // Load existing casualties
    const records = await casualtyService.getCasualties(session.id)
    const cas: Record<string, CasualtyState> = {}
    const opCas: Record<string, CasualtyState> = {}
    for (const r of records) {
      const target = r.player_id === userId ? cas : opCas
      target[r.list_unit_id] = { modelsDestroyed: r.models_destroyed, woundsRemaining: r.wounds_remaining }
    }

    // Subscribe to realtime
    const unsub = casualtyService.subscribeToCasualties(session.id, (payload) => {
      get()._applyCasualtyEvent(payload.new, userId)
    })

    set({
      activeSession: session,
      opponentProfile: profile,
      opponentList: list,
      casualties: cas,
      opponentCasualties: opCas,
      _unsubscribe: unsub,
      loading: false,
    })
  },

  endSession: async (status, summaryMeta) => {
    const { activeSession, _unsubscribe, casualties, opponentCasualties } = get()
    if (!activeSession) return false
    _unsubscribe?.()
    const ok = await sessionService.endSession(activeSession.id, status)
    if (ok) {
      // Create game summary
      summaryService.createSummary({
        sessionId: activeSession.id,
        player1Id: activeSession.player1_id,
        player2Id: activeSession.player2_id,
        player1Faction: summaryMeta?.player1Faction ?? '',
        player2Faction: summaryMeta?.player2Faction ?? '',
        player1Detachment: summaryMeta?.player1Detachment ?? '',
        player2Detachment: summaryMeta?.player2Detachment ?? '',
        sessionCreatedAt: activeSession.created_at,
        player1Casualties: casualties,
        player2Casualties: opponentCasualties,
        player1TotalUnits: 0,
        player2TotalUnits: 0,
      }).catch((e) => console.error('Failed to create summary:', e))
      set({ activeSession: null, opponentProfile: null, opponentList: null, casualties: {}, opponentCasualties: {}, _unsubscribe: null })
    }
    return ok
  },

  clearSession: () => {
    const { _unsubscribe } = get()
    _unsubscribe?.()
    set({ activeSession: null, opponentProfile: null, opponentList: null, casualties: {}, opponentCasualties: {}, _unsubscribe: null, loading: false })
  },

  updateCasualty: (playerId, listUnitId, change) => {
    const { activeSession, casualties, opponentCasualties } = get()
    if (!activeSession) return

    // Determine if this is our casualty or opponent's
    const isOwn = playerId === activeSession.player1_id
    const source = isOwn ? casualties : opponentCasualties
    const key = isOwn ? 'casualties' : 'opponentCasualties'

    const current = source[listUnitId] ?? { modelsDestroyed: 0, woundsRemaining: null }
    const updated = { ...current, ...change }

    set({ [key]: { ...source, [listUnitId]: updated } })

    // Debounced sync to Supabase
    const timerKey = `${playerId}:${listUnitId}`
    if (debounceTimers[timerKey]) clearTimeout(debounceTimers[timerKey])
    debounceTimers[timerKey] = setTimeout(() => {
      casualtyService.upsertCasualty({
        session_id: activeSession.id,
        player_id: playerId,
        list_unit_id: listUnitId,
        models_destroyed: updated.modelsDestroyed,
        wounds_remaining: updated.woundsRemaining,
      })
      delete debounceTimers[timerKey]
    }, 300)
  },

  resetCasualty: (playerId, listUnitId) => {
    const { activeSession, casualties, opponentCasualties } = get()
    if (!activeSession) return

    const isOwn = playerId === activeSession.player1_id
    const source = isOwn ? { ...casualties } : { ...opponentCasualties }
    delete source[listUnitId]
    const key = isOwn ? 'casualties' : 'opponentCasualties'
    set({ [key]: source })

    casualtyService.resetCasualty(activeSession.id, playerId, listUnitId)
  },

  _applyCasualtyEvent: (record, currentUserId) => {
    const isOwn = record.player_id === currentUserId
    const key = isOwn ? 'casualties' : 'opponentCasualties'
    const source = get()[key]
    set({
      [key]: {
        ...source,
        [record.list_unit_id]: {
          modelsDestroyed: record.models_destroyed,
          woundsRemaining: record.wounds_remaining,
        },
      },
    })
  },
}))
