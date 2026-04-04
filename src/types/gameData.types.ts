export interface FactionSummary {
  id: string
  name: string
  slug: string
  datasheetCount: number
}

export interface FactionIndex {
  lastUpdate: string
  factions: FactionSummary[]
}

export interface Profile {
  name: string
  M: string
  T: string
  Sv: string
  W: string
  Ld: string
  OC: string
  invSv: string
  invSvDescr: string
}

export interface Weapon {
  name: string
  type: string
  range: string
  A: string
  BS_WS: string
  S: string
  AP: string
  D: string
  abilities: string
}

export interface Ability {
  id: string
  name: string
  description: string
  type: string
  parameter: string
}

export interface Keyword {
  keyword: string
  model: string
  isFactionKeyword: boolean
}

export interface PointOption {
  cost: number
  models: string
}

export interface Datasheet {
  id: string
  name: string
  factionId: string
  sourceId: string
  role: string
  imageUrl?: string
  unitComposition: string
  transport: string
  leader: string
  loadout: string
  keywords: Keyword[]
  damagedDescription: string
  damagedRange: string
  profiles: Profile[]
  weapons: Weapon[]
  abilities: Ability[]
  pointOptions: PointOption[]
}

export interface Faction {
  id: string
  name: string
  slug: string
  datasheets: Datasheet[]
}
