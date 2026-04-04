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
