import { create } from 'zustand'
import type { ArmyList } from '@/types/armyList.types'
import type { GameSession } from '@/services/gameSessionService'
import * as sessionService from '@/services/gameSessionService'
import * as casualtyService from '@/services/casualtySyncService'
import * as summaryService from '@/services/gameSummaryService'
import { fetchFriendLists } from '@/services/listsSyncService'
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
  pendingInvite: GameSession | null
  pendingInviteProfile: Profile | null
  _unsubscribe: (() => void) | null
  _unsubInvites: (() => void) | null
  _unsubSession: (() => void) | null

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

  subscribeToInvites: (userId: string) => void
  acceptInvite: (userId: string) => Promise<boolean>
  declineInvite: () => Promise<boolean>
  dismissInvite: () => void
}

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  activeSession: null,
  opponentProfile: null,
  opponentList: null,
  loading: false,
  casualties: {},
  opponentCasualties: {},
  pendingInvite: null,
  pendingInviteProfile: null,
  _unsubscribe: null,
  _unsubInvites: null,
  _unsubSession: null,

  startSession: async (player1Id, player1ListId, player2Id, player2ListId) => {
    set({ loading: true })
    const session = await sessionService.createSession(player1Id, player1ListId, player2Id, player2ListId)
    if (!session) {
      set({ loading: false })
      return false
    }

    const profile = await getProfile(player2Id)

    // Subscribe to session changes (waiting for opponent to accept)
    const unsubSession = sessionService.subscribeToSessionChanges(session.id, async (payload) => {
      const updated = payload.new
      if (updated.status === 'active') {
        // Opponent accepted — load their list and start casualty tracking
        const lists = await fetchFriendLists(player2Id)
        const list = lists.find((l) => l.remoteId === player2ListId) ?? null
        if (list) {
          useGameDataStore.getState().loadFaction(list.factionId)
        }
        const unsub = casualtyService.subscribeToCasualties(session.id, (p) => {
          get()._applyCasualtyEvent(p.new, player1Id)
        })
        set({
          activeSession: { ...session, status: 'active' },
          opponentList: list,
          casualties: {},
          opponentCasualties: {},
          _unsubscribe: unsub,
          loading: false,
        })
      } else if (updated.status === 'declined') {
        // Opponent declined
        get()._unsubSession?.()
        set({
          activeSession: null,
          opponentProfile: null,
          opponentList: null,
          _unsubSession: null,
          loading: false,
        })
      }
    })

    set({
      activeSession: session,
      opponentProfile: profile,
      opponentList: null,
      casualties: {},
      opponentCasualties: {},
      _unsubSession: unsubSession,
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

    // If pending and we're player2, show as invite
    if (session.status === 'pending' && session.player2_id === userId) {
      set({
        pendingInvite: session,
        pendingInviteProfile: profile,
        activeSession: null,
        opponentProfile: null,
        opponentList: null,
        loading: false,
      })
      return
    }

    // If pending and we're player1, we're waiting for opponent
    if (session.status === 'pending' && session.player1_id === userId) {
      const unsubSession = sessionService.subscribeToSessionChanges(session.id, async (payload) => {
        const updated = payload.new
        if (updated.status === 'active') {
          const lists = await fetchFriendLists(opponentId)
          const list = lists.find((l) => l.remoteId === opponentListId) ?? null
          if (list) {
            useGameDataStore.getState().loadFaction(list.factionId)
          }
          const unsub = casualtyService.subscribeToCasualties(session.id, (p) => {
            get()._applyCasualtyEvent(p.new, userId)
          })
          set({
            activeSession: { ...session, status: 'active' },
            opponentList: list,
            casualties: {},
            opponentCasualties: {},
            _unsubscribe: unsub,
            loading: false,
          })
        } else if (updated.status === 'declined') {
          get()._unsubSession?.()
          set({
            activeSession: null,
            opponentProfile: null,
            opponentList: null,
            _unsubSession: null,
            loading: false,
          })
        }
      })
      set({
        activeSession: session,
        opponentProfile: profile,
        opponentList: null,
        _unsubSession: unsubSession,
        loading: false,
      })
      return
    }

    // Active session — load full data
    const lists = await fetchFriendLists(opponentId)
    const list = lists.find((l) => l.remoteId === opponentListId) ?? null

    if (list) {
      useGameDataStore.getState().loadFaction(list.factionId)
    }

    const records = await casualtyService.getCasualties(session.id)
    const cas: Record<string, CasualtyState> = {}
    const opCas: Record<string, CasualtyState> = {}
    for (const r of records) {
      const target = r.player_id === userId ? cas : opCas
      target[r.list_unit_id] = { modelsDestroyed: r.models_destroyed, woundsRemaining: r.wounds_remaining }
    }

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
    const { activeSession, _unsubscribe, _unsubSession, casualties, opponentCasualties } = get()
    if (!activeSession) return false
    _unsubscribe?.()
    _unsubSession?.()
    const ok = await sessionService.endSession(activeSession.id, status)
    if (ok) {
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
      set({ activeSession: null, opponentProfile: null, opponentList: null, casualties: {}, opponentCasualties: {}, _unsubscribe: null, _unsubSession: null })
    }
    return ok
  },

  clearSession: () => {
    const { _unsubscribe, _unsubSession } = get()
    _unsubscribe?.()
    _unsubSession?.()
    set({ activeSession: null, opponentProfile: null, opponentList: null, casualties: {}, opponentCasualties: {}, _unsubscribe: null, _unsubSession: null, loading: false })
  },

  updateCasualty: (playerId, listUnitId, change) => {
    const { activeSession, casualties, opponentCasualties } = get()
    if (!activeSession) return

    const isOwn = playerId === activeSession.player1_id
    const source = isOwn ? casualties : opponentCasualties
    const key = isOwn ? 'casualties' : 'opponentCasualties'

    const current = source[listUnitId] ?? { modelsDestroyed: 0, woundsRemaining: null }
    const updated = { ...current, ...change }

    set({ [key]: { ...source, [listUnitId]: updated } })

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

  subscribeToInvites: (userId) => {
    const { _unsubInvites } = get()
    _unsubInvites?.()

    const unsub = sessionService.subscribeToIncomingInvites(userId, async (session) => {
      const profile = await getProfile(session.player1_id)
      set({ pendingInvite: session, pendingInviteProfile: profile })
    })
    set({ _unsubInvites: unsub })
  },

  acceptInvite: async (userId) => {
    const { pendingInvite } = get()
    if (!pendingInvite) return false
    const ok = await sessionService.acceptSession(pendingInvite.id)
    if (!ok) return false

    // Load session data
    set({ pendingInvite: null, pendingInviteProfile: null })
    await get().loadSession(userId)
    return true
  },

  declineInvite: async () => {
    const { pendingInvite } = get()
    if (!pendingInvite) return false
    const ok = await sessionService.declineSession(pendingInvite.id)
    if (ok) {
      set({ pendingInvite: null, pendingInviteProfile: null })
    }
    return ok
  },

  dismissInvite: () => {
    set({ pendingInvite: null, pendingInviteProfile: null })
  },
}))
