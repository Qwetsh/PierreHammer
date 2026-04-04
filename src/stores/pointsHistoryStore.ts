import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Faction } from '@/types/gameData.types'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

/** unitId → first pointOption cost */
type PointsSnapshot = Record<string, number>

interface PointsDiff {
  /** unitId → delta (positive = increase, negative = decrease) */
  changes: Record<string, number>
  /** ISO timestamp when the diff was recorded */
  detectedAt: string
}

interface PointsHistoryState {
  /** Previous points snapshot per faction slug */
  snapshots: Record<string, PointsSnapshot>
  /** Active diffs per faction slug */
  diffs: Record<string, PointsDiff>
  /** Record a faction load — computes diff if points changed */
  recordFaction: (faction: Faction, dataUpdated: boolean) => void
  /** Get point delta for a specific unit (0 if none or expired) */
  getDelta: (unitId: string, factionSlug: string) => number
}

function buildSnapshot(faction: Faction): PointsSnapshot {
  const snap: PointsSnapshot = {}
  for (const ds of faction.datasheets) {
    if (ds.pointOptions.length > 0) {
      snap[ds.id] = ds.pointOptions[0].cost
    }
  }
  return snap
}

export const usePointsHistoryStore = create<PointsHistoryState>()(
  persist(
    (set, get) => ({
      snapshots: {},
      diffs: {},

      recordFaction: (faction: Faction, dataUpdated: boolean) => {
        const slug = faction.slug
        const newSnap = buildSnapshot(faction)
        const oldSnap = get().snapshots[slug]

        if (dataUpdated && oldSnap) {
          const changes: Record<string, number> = {}
          const allIds = new Set([...Object.keys(oldSnap), ...Object.keys(newSnap)])
          for (const id of allIds) {
            const oldPts = oldSnap[id] ?? 0
            const newPts = newSnap[id] ?? 0
            if (oldPts !== 0 && newPts !== 0 && oldPts !== newPts) {
              changes[id] = newPts - oldPts
            }
          }
          if (Object.keys(changes).length > 0) {
            set((state) => ({
              diffs: {
                ...state.diffs,
                [slug]: { changes, detectedAt: new Date().toISOString() },
              },
              snapshots: { ...state.snapshots, [slug]: newSnap },
            }))
            return
          }
        }

        set((state) => ({
          snapshots: { ...state.snapshots, [slug]: newSnap },
        }))
      },

      getDelta: (unitId: string, factionSlug: string) => {
        const diff = get().diffs[factionSlug]
        if (!diff) return 0
        const elapsed = Date.now() - new Date(diff.detectedAt).getTime()
        if (elapsed > THREE_DAYS_MS) return 0
        return diff.changes[unitId] ?? 0
      },
    }),
    {
      name: 'pierrehammer-points-history',
    },
  ),
)
