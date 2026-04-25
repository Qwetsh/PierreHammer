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
  legend: string
  role: string
  loadout: string
  transport: string
  virtual: string
  leader_head: string
  leader_footer: string
  damaged_w: string
  damaged_description: string
  link: string
}

export interface RawAbilityDef {
  id: string
  name: string
  legend: string
  faction_id: string
  description: string
}

export interface RawAbility {
  datasheet_id: string
  line: string
  ability_id: string
  model: string
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
  line_in_wargear: string
  dice: string
  name: string
  description: string
  range: string
  type: string
  A: string
  BS_WS: string
  S: string
  AP: string
  D: string
}

export interface RawPoints {
  datasheet_id: string
  line: string
  description: string
  cost: string
}

export interface RawStratagem {
  faction_id: string
  name: string
  id: string
  type: string
  cp_cost: string
  legend: string
  turn: string
  phase: string
  detachment: string
  detachment_id: string
  description: string
}

export interface RawDetachmentAbility {
  id: string
  faction_id: string
  name: string
  legend: string
  description: string
  detachment: string
  detachment_id: string
}

export interface RawEnhancement {
  faction_id: string
  id: string
  name: string
  cost: string
  detachment: string
  detachment_id: string
  legend: string
  description: string
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

export interface Stratagem {
  id: string
  name: string
  type: string
  cpCost: number
  legend: string
  turn: string
  phase: string
  description: string
}

export interface Enhancement {
  id: string
  name: string
  cost: number
  legend: string
  description: string
}

export interface Detachment {
  id: string
  name: string
  rule: { name: string; legend: string; description: string } | null
  stratagems: Stratagem[]
  enhancements: Enhancement[]
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
  stratagems: RawStratagem[]
  detachmentAbilities: RawDetachmentAbility[]
  enhancements: RawEnhancement[]
  errors: string[]
  warnings: string[]
}
