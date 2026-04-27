/**
 * Citadel paint schemes per faction.
 * Each faction has a primary palette (base colors) and optional highlight/detail colors.
 * Colors are real Citadel hex values with their official paint names.
 */

export interface PaintColor {
  name: string
  hex: string
  type: 'base' | 'layer' | 'shade' | 'contrast' | 'dry' | 'technical'
}

export interface FactionPaintScheme {
  factionId: string
  schemeName: string
  colors: PaintColor[]
}

export const factionPaintSchemes: Record<string, FactionPaintScheme> = {
  'space-marines': {
    factionId: 'space-marines',
    schemeName: 'Ultramarines',
    colors: [
      { name: 'Macragge Blue', hex: '#0D407F', type: 'base' },
      { name: 'Altdorf Guard Blue', hex: '#1F56A8', type: 'layer' },
      { name: 'Calgar Blue', hex: '#4272B8', type: 'layer' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'White Scar', hex: '#FFFFFF', type: 'layer' },
    ],
  },
  'chaos-space-marines': {
    factionId: 'chaos-space-marines',
    schemeName: 'Black Legion',
    colors: [
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Balthasar Gold', hex: '#A47552', type: 'base' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Eshin Grey', hex: '#484B4E', type: 'layer' },
      { name: 'Agrax Earthshade', hex: '#35312C', type: 'shade' },
    ],
  },
  'necrons': {
    factionId: 'necrons',
    schemeName: 'Szarekhan Dynasty',
    colors: [
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Runelord Brass', hex: '#B49969', type: 'base' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'Ironbreaker', hex: '#A1A6A9', type: 'layer' },
      { name: 'Tesseract Glow', hex: '#49B04A', type: 'technical' },
      { name: 'Moot Green', hex: '#52B244', type: 'layer' },
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
    ],
  },
  'aeldari': {
    factionId: 'aeldari',
    schemeName: 'Ulthwe',
    colors: [
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Eshin Grey', hex: '#484B4E', type: 'layer' },
      { name: 'Wraithbone', hex: '#DBD1B2', type: 'base' },
      { name: 'Skeleton Horde', hex: '#EBD05F', type: 'contrast' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'White Scar', hex: '#FFFFFF', type: 'layer' },
    ],
  },
  'orks': {
    factionId: 'orks',
    schemeName: 'Goffs',
    colors: [
      { name: 'Orruk Flesh', hex: '#7EA04F', type: 'base' },
      { name: 'Warpstone Glow', hex: '#1E7331', type: 'layer' },
      { name: 'Biel-Tan Green', hex: '#18603B', type: 'shade' },
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Mournfang Brown', hex: '#640909', type: 'base' },
      { name: 'Agrax Earthshade', hex: '#35312C', type: 'shade' },
      { name: 'Ushabti Bone', hex: '#ACA47D', type: 'layer' },
    ],
  },
  't-au-empire': {
    factionId: 't-au-empire',
    schemeName: "T'au Sept",
    colors: [
      { name: 'XV-88', hex: '#6C4811', type: 'base' },
      { name: 'Tau Light Ochre', hex: '#BC6B10', type: 'layer' },
      { name: 'Agrax Earthshade', hex: '#35312C', type: 'shade' },
      { name: 'Kislev Flesh', hex: '#D1A570', type: 'layer' },
      { name: 'White Scar', hex: '#FFFFFF', type: 'layer' },
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
    ],
  },
  'tyranids': {
    factionId: 'tyranids',
    schemeName: 'Hive Fleet Leviathan',
    colors: [
      { name: 'Rakarth Flesh', hex: '#A29882', type: 'base' },
      { name: 'Naggaroth Night', hex: '#3B2B50', type: 'base' },
      { name: 'Xereus Purple', hex: '#47125A', type: 'layer' },
      { name: 'Druchii Violet', hex: '#3D0F63', type: 'shade' },
      { name: 'Pallid Wych Flesh', hex: '#CECCA3', type: 'layer' },
      { name: 'Yriel Yellow', hex: '#FFD900', type: 'layer' },
      { name: 'Screamer Pink', hex: '#7A0C4D', type: 'base' },
    ],
  },
  'death-guard': {
    factionId: 'death-guard',
    schemeName: 'Death Guard',
    colors: [
      { name: 'Death Guard Green', hex: '#6D7A37', type: 'base' },
      { name: 'Ogryn Camo', hex: '#9DA94B', type: 'layer' },
      { name: 'Agrax Earthshade', hex: '#35312C', type: 'shade' },
      { name: 'Balthasar Gold', hex: '#A47552', type: 'base' },
      { name: 'Rakarth Flesh', hex: '#A29882', type: 'base' },
      { name: 'Typhus Corrosion', hex: '#3A2F1F', type: 'technical' },
      { name: 'Ryza Rust', hex: '#EC6B10', type: 'dry' },
      { name: 'Nurgle\'s Rot', hex: '#9B8F22', type: 'technical' },
    ],
  },
  'thousand-sons': {
    factionId: 'thousand-sons',
    schemeName: 'Thousand Sons',
    colors: [
      { name: 'Thousand Sons Blue', hex: '#00506F', type: 'base' },
      { name: 'Ahriman Blue', hex: '#007FA3', type: 'layer' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Screamer Pink', hex: '#7A0C4D', type: 'base' },
      { name: 'Pink Horror', hex: '#8C2478', type: 'layer' },
      { name: 'White Scar', hex: '#FFFFFF', type: 'layer' },
    ],
  },
  'world-eaters': {
    factionId: 'world-eaters',
    schemeName: 'World Eaters',
    colors: [
      { name: 'Khorne Red', hex: '#6A0001', type: 'base' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'Wraithbone', hex: '#DBD1B2', type: 'base' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Brass Scorpion', hex: '#B87333', type: 'layer' },
    ],
  },
  'emperor-s-children': {
    factionId: 'emperor-s-children',
    schemeName: "Emperor's Children",
    colors: [
      { name: 'Phoenician Purple', hex: '#440052', type: 'base' },
      { name: 'Xereus Purple', hex: '#47125A', type: 'layer' },
      { name: 'Druchii Violet', hex: '#3D0F63', type: 'shade' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Fulgrim Pink', hex: '#F4AFD7', type: 'layer' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
    ],
  },
  'adeptus-custodes': {
    factionId: 'adeptus-custodes',
    schemeName: 'Adeptus Custodes',
    colors: [
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Liberator Gold', hex: '#CCB44D', type: 'layer' },
      { name: 'Reikland Fleshshade', hex: '#CA6C4D', type: 'shade' },
      { name: 'Khorne Red', hex: '#6A0001', type: 'base' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Stormhost Silver', hex: '#BFBFBF', type: 'layer' },
    ],
  },
  'adepta-sororitas': {
    factionId: 'adepta-sororitas',
    schemeName: 'Order of Our Martyred Lady',
    colors: [
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Eshin Grey', hex: '#484B4E', type: 'layer' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Evil Sunz Scarlet', hex: '#C01411', type: 'layer' },
      { name: 'Zandri Dust', hex: '#9E915C', type: 'base' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'White Scar', hex: '#FFFFFF', type: 'layer' },
    ],
  },
  'grey-knights': {
    factionId: 'grey-knights',
    schemeName: 'Grey Knights',
    colors: [
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Ironbreaker', hex: '#A1A6A9', type: 'layer' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'Stormhost Silver', hex: '#BFBFBF', type: 'layer' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Caliban Green', hex: '#003D15', type: 'base' },
    ],
  },
  'astra-militarum': {
    factionId: 'astra-militarum',
    schemeName: 'Cadian',
    colors: [
      { name: 'Castellan Green', hex: '#264715', type: 'base' },
      { name: 'Loren Forest', hex: '#476B2D', type: 'layer' },
      { name: 'Zandri Dust', hex: '#9E915C', type: 'base' },
      { name: 'Ushabti Bone', hex: '#ACA47D', type: 'layer' },
      { name: 'Agrax Earthshade', hex: '#35312C', type: 'shade' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Cadian Fleshtone', hex: '#C47652', type: 'layer' },
    ],
  },
  'adeptus-mechanicus': {
    factionId: 'adeptus-mechanicus',
    schemeName: 'Mars',
    colors: [
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Evil Sunz Scarlet', hex: '#C01411', type: 'layer' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Ironbreaker', hex: '#A1A6A9', type: 'layer' },
      { name: 'Zandri Dust', hex: '#9E915C', type: 'base' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
    ],
  },
  'imperial-knights': {
    factionId: 'imperial-knights',
    schemeName: 'House Terryn',
    colors: [
      { name: 'Macragge Blue', hex: '#0D407F', type: 'base' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'White Scar', hex: '#FFFFFF', type: 'layer' },
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
    ],
  },
  'chaos-knights': {
    factionId: 'chaos-knights',
    schemeName: 'House Herpetrax',
    colors: [
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Balthasar Gold', hex: '#A47552', type: 'base' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Warpstone Glow', hex: '#1E7331', type: 'layer' },
      { name: 'Ironbreaker', hex: '#A1A6A9', type: 'layer' },
    ],
  },
  'chaos-daemons': {
    factionId: 'chaos-daemons',
    schemeName: 'Chaos Daemons',
    colors: [
      { name: 'Khorne Red', hex: '#6A0001', type: 'base' },
      { name: 'Screamer Pink', hex: '#7A0C4D', type: 'base' },
      { name: 'Naggaroth Night', hex: '#3B2B50', type: 'base' },
      { name: 'Warpstone Glow', hex: '#1E7331', type: 'layer' },
      { name: 'Yriel Yellow', hex: '#FFD900', type: 'layer' },
      { name: 'Druchii Violet', hex: '#3D0F63', type: 'shade' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
    ],
  },
  'drukhari': {
    factionId: 'drukhari',
    schemeName: 'Kabal of the Black Heart',
    colors: [
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Kabalite Green', hex: '#008962', type: 'layer' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'Incubi Darkness', hex: '#0B474A', type: 'base' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Screamer Pink', hex: '#7A0C4D', type: 'base' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
    ],
  },
  'genestealer-cults': {
    factionId: 'genestealer-cults',
    schemeName: 'Genestealer Cults',
    colors: [
      { name: 'Naggaroth Night', hex: '#3B2B50', type: 'base' },
      { name: 'Xereus Purple', hex: '#47125A', type: 'layer' },
      { name: 'Zandri Dust', hex: '#9E915C', type: 'base' },
      { name: 'Rakarth Flesh', hex: '#A29882', type: 'base' },
      { name: 'Genestealer Purple', hex: '#7658A5', type: 'layer' },
      { name: 'Agrax Earthshade', hex: '#35312C', type: 'shade' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
    ],
  },
  'leagues-of-votann': {
    factionId: 'leagues-of-votann',
    schemeName: 'Greater Thurian League',
    colors: [
      { name: 'Mechanicus Standard Grey', hex: '#3D4B4D', type: 'base' },
      { name: 'Dawnstone', hex: '#70756E', type: 'layer' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
    ],
  },
  'imperial-agents': {
    factionId: 'imperial-agents',
    schemeName: 'Imperial Agents',
    colors: [
      { name: 'Abaddon Black', hex: '#231F20', type: 'base' },
      { name: 'Mechanicus Standard Grey', hex: '#3D4B4D', type: 'base' },
      { name: 'Leadbelcher', hex: '#888D91', type: 'base' },
      { name: 'Retributor Armour', hex: '#C39E43', type: 'base' },
      { name: 'Mephiston Red', hex: '#9A1115', type: 'base' },
      { name: 'Nuln Oil', hex: '#14100E', type: 'shade' },
      { name: 'White Scar', hex: '#FFFFFF', type: 'layer' },
    ],
  },
}
