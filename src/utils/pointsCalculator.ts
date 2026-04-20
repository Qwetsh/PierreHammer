import type { ListUnit } from '@/types/armyList.types'
import type { Datasheet } from '@/types/gameData.types'

/** Resolve live points for a unit from faction data, falling back to stored value */
export function resolveUnitPoints(unit: ListUnit, datasheets?: Datasheet[]): number {
  if (datasheets) {
    const ds = datasheets.find((d) => d.id === unit.datasheetId)
    if (ds && ds.pointOptions.length > 0) {
      const idx = unit.selectedPointOptionIndex ?? 0
      return ds.pointOptions[idx]?.cost ?? ds.pointOptions[0].cost
    }
  }
  return unit.points
}

export function calculateTotalPoints(units: ListUnit[], datasheets?: Datasheet[]): number {
  return units.reduce((sum, u) => sum + resolveUnitPoints(u, datasheets), 0)
}

/** Count squads (units that are not attached heroes) */
export function countSquads(units: ListUnit[]): number {
  return units.filter((u) => !u.attachedToId).length
}

/** Get the total points for a squad including attached heroes */
export function resolveSquadTotalPoints(
  squad: ListUnit,
  allUnits: ListUnit[],
  datasheets?: Datasheet[],
): { squadPoints: number; heroPoints: number; total: number } {
  const squadPoints = resolveUnitPoints(squad, datasheets)
  const attachedHeroes = allUnits.filter((u) => u.attachedToId === squad.id)
  const heroPoints = attachedHeroes.reduce((sum, h) => sum + resolveUnitPoints(h, datasheets), 0)
  return { squadPoints, heroPoints, total: squadPoints + heroPoints }
}
