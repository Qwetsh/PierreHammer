// Raw types — direct mapping from CSV columns
export interface RawFaction {
  id: string
  name: string
  link: string
}

export interface RawDatasheet {
  id: string
  name: string
  faction_id: string
  source_id: string
  role: string
  unit_composition: string
  transport: string
  leader: string
  loadout: string
  keywords: string
  damaged_description: string
  damaged_range: string
}

export interface RawAbility {
  id: string
  datasheet_id: string
  name: string
  description: string
  type: string
  parameter: string
}

export interface RawKeyword {
  datasheet_id: string
  keyword: string
  model: string
  is_faction_keyword: string
}

export interface RawModel {
  datasheet_id: string
  line: string
  name: string
  M: string
  T: string
  Sv: string
  W: string
  Ld: string
  OC: string
  inv_sv: string
  inv_sv_descr: string
}

export interface RawWargear {
  datasheet_id: string
  line: string
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

export interface RawPoints {
  datasheet_id: string
  cost: string
  models: string
}

// Transformed types — structured for app consumption
export interface Faction {
  id: string
  name: string
  link: string
  datasheetIds: string[]
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

export interface ParseResult {
  factions: Map<string, Faction>
  datasheets: Map<string, Datasheet>
  errors: string[]
  warnings: string[]
}
