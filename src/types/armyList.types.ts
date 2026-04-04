export interface ListUnit {
  datasheetId: string
  datasheetName: string
  points: number
  selectedPointOptionIndex: number
  selectedWeapons: string[]
  notes: string
}

export type PointsLimit = 1000 | 2000 | 3000

export interface ArmyList {
  id: string
  name: string
  factionId: string
  detachment: string
  pointsLimit: PointsLimit
  units: ListUnit[]
  createdAt: number
}
