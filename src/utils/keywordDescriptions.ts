/** Descriptions explicatives des mots-cles d'arme W40K 10e */
const descriptions: Record<string, string[]> = {
  'Sustained Hits': [
    'Chaque jet de touche de 6 (critique)',
    'genere des touches supplementaires.',
    'Ex: Sustained Hits 2 = chaque 6 donne 2 touches bonus.',
  ],
  'Lethal Hits': [
    'Les jets de touche de 6 (critiques)',
    'blessent automatiquement la cible,',
    'sans jet de blessure.',
  ],
  'Devastating Wounds': [
    'Les blessures critiques (6 au jet de blessure)',
    'deviennent des Mortal Wounds:',
    'elles ignorent totalement la sauvegarde.',
  ],
  'Anti': [
    'Contre les cibles ayant le mot-cle indique,',
    'le seuil de blessure critique est abaisse.',
    'Ex: Anti-Vehicle 4+ = blessure crit sur 4+ vs vehicules.',
  ],
  'Twin-linked': [
    'Permet de relancer les jets de blessure rates.',
    'Augmente significativement les chances de blesser.',
  ],
  'Torrent': [
    'Cette arme touche automatiquement,',
    'aucun jet de touche n\'est necessaire.',
  ],
  'Blast': [
    'Gagne +1 attaque par tranche de 5 figurines',
    'dans l\'unite cible.',
    'Ex: cible de 10 fig. = +2 attaques.',
  ],
  'Rapid Fire': [
    'A demi-portee, gagne des attaques supplementaires.',
    'Ex: Rapid Fire 2 = +2 attaques a demi-portee.',
    'Cocher "Demi-portee" pour activer.',
  ],
  'Melta': [
    'A demi-portee, ajoute des degats supplementaires',
    'a chaque blessure non sauvegardee.',
    'Ex: Melta 2 = +2 degats a demi-portee.',
    'Cocher "Demi-portee" pour activer.',
  ],
  'Lance': [
    'Si le tireur a charge ce tour,',
    'le seuil de blessure est reduit de 1.',
    'Cocher "A charge" pour activer.',
  ],
  'Heavy': [
    'Si le tireur est reste stationnaire,',
    'le seuil de touche est reduit de 1.',
    'Cocher "Stationnaire" pour activer.',
  ],
  'Ignores Cover': [
    'La cible ne beneficie pas du bonus',
    'de couvert sur sa sauvegarde.',
  ],
  'Hazardous': [
    'Apres avoir tire, lancer 1D6 par modele.',
    'Sur un 1, le tireur subit 3 mortals wounds.',
    '(Non simule dans le calculateur.)',
  ],
  'Pistol': [
    'Peut tirer meme si l\'unite est engagee',
    'au corps a corps.',
    '(Regle de jeu, pas d\'impact sur le calcul.)',
  ],
  'Precision': [
    'Les jets de touche de 6 peuvent cibler',
    'un personnage attache a une unite.',
    '(Non simule dans le calculateur.)',
  ],
  'Assault': [
    'Peut tirer meme apres avoir avance.',
    '(Regle de jeu, pas d\'impact sur le calcul.)',
  ],
  'One Shot': [
    'Ne peut tirer qu\'une seule fois par partie.',
    '(Regle de jeu, pas d\'impact sur le calcul.)',
  ],
  'Indirect Fire': [
    'Peut tirer sur des cibles non visibles.',
    'Malus de -1 au jet de touche.',
    'La cible beneficie toujours du couvert.',
  ],
}

export function getKeywordDescription(keyword: string): string[] {
  // Try exact match first
  if (descriptions[keyword]) return descriptions[keyword]

  const kw = keyword.toLowerCase()

  // Try case-insensitive matching (base keyword e.g. "rapid fire 2" -> "Rapid Fire")
  for (const key of Object.keys(descriptions)) {
    if (kw.startsWith(key.toLowerCase())) return descriptions[key]
  }

  // Anti-X special case
  if (kw.startsWith('anti-')) return descriptions['Anti']

  return []
}
