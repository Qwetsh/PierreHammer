import type { CombatResult, WeaponKeywords, AbilityEffect } from '@/types/combat.types'
import type { Weapon, Profile } from '@/types/gameData.types'
import { parseDiceNotation, parseThreshold, getWoundThreshold } from './combatEngine'

export interface StepExplanation {
  lines: string[]
}

export interface CombatExplanations {
  attacks: StepExplanation
  hits: StepExplanation
  wounds: StepExplanation
  saves: StepExplanation
  damage: StepExplanation
}

/** An effect with its human-readable source name */
export interface NamedEffect {
  source: string
  effects: AbilityEffect
}

export function buildExplanations(opts: {
  weapon: Weapon
  weaponKeywords: WeaponKeywords
  attackerCount: number
  defenderCount: number
  attackerProfile: Profile
  defenderProfile: Profile
  attackerEffects: AbilityEffect
  defenderEffects: AbilityEffect
  result: CombatResult
  halfRange: boolean
  charged: boolean
  stationary: boolean
  inCover: boolean
  /** Individual named sources for attacker (abilities, enhancement, stratagems) */
  attackerSources?: NamedEffect[]
  /** Individual named sources for defender */
  defenderSources?: NamedEffect[]
}): CombatExplanations {
  const {
    weapon, weaponKeywords: kw, attackerCount, defenderCount,
    defenderProfile, result,
    halfRange, charged, stationary, inCover,
    attackerSources = [], defenderSources = [],
  } = opts

  const isRanged = weapon.type.toLowerCase().includes('ranged') || parseThreshold(weapon.range) > 0

  // Helper: find named sources that contribute a specific phase modifier
  function findModSources(sources: NamedEffect[], phase: string): { source: string; value: number }[] {
    const out: { source: string; value: number }[] = []
    for (const s of sources) {
      if (!s.effects.modifiers) continue
      const mods = s.effects.modifiers.filter(m => m.phase === phase)
      const total = mods.reduce((sum, m) => sum + m.value, 0)
      if (total !== 0) out.push({ source: s.source, value: total })
    }
    return out
  }

  // Helper: find named sources that contribute a specific boolean/value effect
  function findEffectSources(sources: NamedEffect[], check: (e: AbilityEffect) => boolean): string[] {
    return sources.filter(s => check(s.effects)).map(s => s.source)
  }

  // === ATTACKS ===
  const attackLines: string[] = []
  const baseA = parseDiceNotation(weapon.A)
  attackLines.push(`${weapon.A} att. x ${attackerCount} modele${attackerCount > 1 ? 's' : ''} = ${round(baseA * attackerCount)}`)

  if (kw.blast && defenderCount > 0) {
    const perModel = Math.floor(defenderCount / 5)
    const bonus = perModel * attackerCount
    if (bonus > 0) attackLines.push(`Blast: +${bonus} (1 att. suppl. par tranche de 5 fig. cible)`)
  }
  if (kw.rapidFire !== undefined && halfRange) {
    const rfBonus = parseDiceNotation(kw.rapidFire) * attackerCount
    attackLines.push(`Rapid Fire ${kw.rapidFire}: +${round(rfBonus)} att. (demi-portee)`)
  }
  if (kw.rapidFire !== undefined && !halfRange) {
    attackLines.push(`Rapid Fire ${kw.rapidFire}: pas de bonus (hors demi-portee)`)
  }

  // Extra attacks from named sources
  const extraAtkSources = findEffectSources(attackerSources, e => !!e.extraAttacks)
  if (extraAtkSources.length > 0) {
    const total = attackerSources.filter(s => s.effects.extraAttacks).reduce((sum, s) => sum + (s.effects.extraAttacks ?? 0), 0)
    attackLines.push(`${extraAtkSources.join(' + ')}: +${total * attackerCount} att.`)
  }

  // Attacks phase modifiers
  const atkModSources = findModSources(attackerSources, 'attacks')
  for (const { source, value } of atkModSources) {
    attackLines.push(`${source}: ${value > 0 ? '+' : ''}${value} att./modele`)
  }

  attackLines.push(`Total: ${round(result.attacksTotal)} attaques`)

  // === HITS ===
  const hitLines: string[] = []
  const isTorrent = !!kw.torrent
  if (isTorrent) {
    hitLines.push('Torrent: touche automatique, pas de jet')
  } else {
    const baseBS = parseThreshold(weapon.BS_WS)
    hitLines.push(`${isRanged ? 'Competence de Tir (CT)' : 'Competence de Combat (CC)'} de l'arme: ${baseBS}+`)

    if (kw.heavy) {
      if (stationary) hitLines.push(`Heavy: -1 seuil (stationnaire) -> ${baseBS - 1}+`)
      else hitLines.push('Heavy: pas de bonus (a bouge)')
    }

    // Stealth from named defender sources
    if (isRanged) {
      const stealthSources = findEffectSources(defenderSources, e => !!e.stealth)
      if (stealthSources.length > 0) {
        hitLines.push(`${stealthSources.join(' + ')}: +1 seuil (Stealth)`)
      }
    }

    // Hit modifiers from named attacker sources
    const atkHitMods = findModSources(attackerSources, 'hit')
    for (const { source, value } of atkHitMods) {
      hitLines.push(`${source}: ${value > 0 ? '-' : '+'}${Math.abs(value)} au seuil de touche`)
    }

    // Hit modifiers from named defender sources
    const defHitMods = findModSources(defenderSources, 'hit')
    for (const { source, value } of defHitMods) {
      hitLines.push(`${source}: ${value > 0 ? '-' : '+'}${Math.abs(value)} au seuil de touche`)
    }

    hitLines.push(`Seuil final: ${result.steps.hitThreshold}+ (${pctSuccess(result.steps.hitThreshold)}% de reussite)`)
  }

  if (kw.sustainedHits !== undefined) {
    hitLines.push(`Sustained Hits ${kw.sustainedHits}: chaque 6 genere ${kw.sustainedHits} touche(s) bonus`)
  }
  if (kw.lethalHits) {
    hitLines.push('Lethal Hits: les 6 naturels comptent comme blessures auto.')
  }

  // === WOUNDS ===
  const woundLines: string[] = []
  const S = parseThreshold(weapon.S)
  const T = parseThreshold(defenderProfile.T)
  const baseWound = getWoundThreshold(S, T)
  woundLines.push(`Force de l'arme (S): ${S}`)
  woundLines.push(`Endurance de la cible (T): ${T}`)
  const woundReason =
    S >= 2 * T ? `S >= 2x T -> seuil 2+` :
    S > T ? `S > T -> seuil 3+` :
    S === T ? `S = T -> seuil 4+` :
    T >= 2 * S ? `T >= 2x S -> seuil 6+` : `S < T -> seuil 5+`
  woundLines.push(woundReason)

  if (kw.lance) {
    if (charged) woundLines.push(`Lance: -1 seuil (a charge) -> ${baseWound - 1}+`)
    else woundLines.push('Lance: pas de bonus (pas de charge)')
  }

  // Wound modifiers from named sources
  const atkWoundMods = findModSources(attackerSources, 'wound')
  for (const { source, value } of atkWoundMods) {
    woundLines.push(`${source}: ${value > 0 ? '-' : '+'}${Math.abs(value)} au seuil de blessure`)
  }

  woundLines.push(`Seuil final: ${result.steps.woundThreshold}+ (${pctSuccess(result.steps.woundThreshold)}%)`)

  if (kw.twinLinked) woundLines.push('Twin-linked: relance les jets de blessure rates')
  if (kw.anti && kw.anti.length > 0) {
    kw.anti.forEach(a => woundLines.push(`Anti-${a.keyword} ${a.threshold}+: crit blessure des ${a.threshold}+`))
  }
  if (kw.devastatingWounds) woundLines.push('Devastating Wounds: crits = mortal wounds (ignorent svg)')

  // === SAVES ===
  const saveLines: string[] = []
  const sv = parseThreshold(defenderProfile.Sv)
  const ap = parseThreshold(weapon.AP)
  const apValue = weapon.AP.includes('-') ? Math.abs(ap) : ap
  const modifiedSave = sv + apValue
  saveLines.push(`Sauvegarde de la cible (Sv): ${sv}+`)
  saveLines.push(`Penetration d'armure de l'arme (AP): -${apValue}`)
  saveLines.push(`Svg modifiee: ${sv}+ + ${apValue} = ${modifiedSave}+`)

  if (inCover && isRanged && !kw.ignoresCover) {
    const ignSources = findEffectSources(attackerSources, e => !!e.ignoresCover)
    if (ignSources.length > 0) {
      saveLines.push(`Couvert annule par: ${ignSources.join(', ')}`)
    } else {
      saveLines.push('Couvert: -1 au seuil -> meilleure svg')
    }
  }
  if (kw.ignoresCover) {
    saveLines.push('Arme ignore le couvert')
  }

  // Save modifiers from named sources
  const defSaveMods = findModSources(defenderSources, 'save')
  for (const { source, value } of defSaveMods) {
    saveLines.push(`${source}: ${value > 0 ? '-' : '+'}${Math.abs(value)} au seuil de svg`)
  }
  const atkSaveMods = findModSources(attackerSources, 'save')
  for (const { source, value } of atkSaveMods) {
    saveLines.push(`${source}: ${value > 0 ? '+' : '-'}${Math.abs(value)} au seuil de svg (AP)`)
  }

  // Invulnerable from named sources
  const invSv = parseThreshold(defenderProfile.invSv)
  const invulnSources = findEffectSources(defenderSources, e => !!e.invulnerable)
  if (invSv > 0 && invulnSources.length === 0) {
    saveLines.push(`Inv. profil: ${invSv}+${result.steps.usedInvuln ? ' (meilleure -> utilisee)' : ' (svg modifiee meilleure)'}`)
  } else if (invulnSources.length > 0) {
    const bestAbilityInv = Math.min(...defenderSources.filter(s => s.effects.invulnerable).map(s => s.effects.invulnerable!.value))
    const bestInv = invSv > 0 ? Math.min(invSv, bestAbilityInv) : bestAbilityInv
    saveLines.push(`Inv. ${bestInv}+ (${invulnSources.join(', ')})${result.steps.usedInvuln ? ' -> utilisee' : ' (svg modifiee meilleure)'}`)
  } else if (invSv > 0) {
    saveLines.push(`Inv. profil: ${invSv}+${result.steps.usedInvuln ? ' -> utilisee' : ' (svg meilleure)'}`)
  }

  saveLines.push(`Seuil final: ${result.steps.saveThreshold}+ (${100 - pctSuccess(result.steps.saveThreshold)}% de blessures passent)`)

  // === DAMAGE ===
  const damageLines: string[] = []
  const baseDmg = parseDiceNotation(weapon.D)
  damageLines.push(`Arme: ${weapon.D} degat${baseDmg > 1 ? 's' : ''}/blessure (moy. ${round(baseDmg)})`)

  if (kw.melta !== undefined) {
    if (halfRange) damageLines.push(`Melta ${kw.melta}: +${kw.melta} degats (demi-portee)`)
    else damageLines.push(`Melta ${kw.melta}: pas de bonus (hors demi-portee)`)
  }

  // Damage reduction from named sources
  const dmgRedSources = findEffectSources(defenderSources, e => !!e.damageReduction)
  if (dmgRedSources.length > 0) {
    const total = defenderSources.filter(s => s.effects.damageReduction).reduce((sum, s) => sum + (s.effects.damageReduction ?? 0), 0)
    damageLines.push(`${dmgRedSources.join(' + ')}: -${total} degat/blessure (min 1)`)
  }

  // Damage modifiers from named attacker sources
  const atkDmgMods = findModSources(attackerSources, 'damage')
  for (const { source, value } of atkDmgMods) {
    damageLines.push(`${source}: +${value} degat/blessure`)
  }

  damageLines.push(`Degats effectifs/blessure: ${result.steps.avgDamagePerWound}`)

  // FnP from named sources
  if (result.steps.fnpThreshold) {
    const fnpSources = findEffectSources(defenderSources, e => !!e.feelNoPain)
    const fnpPct = pctSuccess(result.steps.fnpThreshold)
    if (fnpSources.length > 0) {
      damageLines.push(`FnP ${result.steps.fnpThreshold}+ (${fnpSources.join(', ')}): ignore ${fnpPct}% des degats`)
    } else {
      damageLines.push(`Feel No Pain ${result.steps.fnpThreshold}+: ignore ${fnpPct}% des degats`)
    }
  }

  if (result.mortalWounds > 0) {
    damageLines.push(`Mortal Wounds: ${round(result.mortalWounds)} (ignorent la svg)`)
  }

  const defW = parseThreshold(defenderProfile.W)
  if (defW > 0) {
    damageLines.push(`PV par modele: ${defW} -> ~${round(result.estimatedKills)} elimines`)
  }

  return {
    attacks: { lines: attackLines },
    hits: { lines: hitLines },
    wounds: { lines: woundLines },
    saves: { lines: saveLines },
    damage: { lines: damageLines },
  }
}

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

function pctSuccess(threshold: number): number {
  return Math.round((7 - Math.max(2, Math.min(6, threshold))) / 6 * 100)
}
