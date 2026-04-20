export interface ListEnhancement {
  enhancementId: string
  enhancementName: string
  cost: number
}

export interface ListUnit {
  id: string
  datasheetId: string
  datasheetName: string
  points: number
  selectedPointOptionIndex: number
  selectedWeapons: string[]
  notes: string
  attachedToId?: string
  enhancement?: ListEnhancement
}

export type PointsLimit = 1000 | 2000 | 3000

export interface ArmyList {
  id: string
  name: string
  factionId: string
  detachment: string
  detachmentId?: string
  pointsLimit: PointsLimit
  units: ListUnit[]
  createdAt: number
}
