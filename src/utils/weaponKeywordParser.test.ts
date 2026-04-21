import { describe, it, expect } from 'vitest'
import { parseWeaponKeywords } from './weaponKeywordParser'

describe('parseWeaponKeywords', () => {
  // --- AC #6: empty/null ---
  it('returns {} for empty string', () => {
    expect(parseWeaponKeywords('')).toEqual({})
  })

  it('returns {} for whitespace-only string', () => {
    expect(parseWeaponKeywords('   ')).toEqual({})
  })

  // --- AC #3: boolean keywords ---
  it('parses lethal hits', () => {
    expect(parseWeaponKeywords('lethal hits')).toEqual({ lethalHits: true })
  })

  it('parses devastating wounds', () => {
    expect(parseWeaponKeywords('devastating wounds')).toEqual({ devastatingWounds: true })
  })

  it('parses twin-linked', () => {
    expect(parseWeaponKeywords('twin-linked')).toEqual({ twinLinked: true })
  })

  it('parses torrent', () => {
    expect(parseWeaponKeywords('torrent')).toEqual({ torrent: true })
  })

  it('parses blast', () => {
    expect(parseWeaponKeywords('blast')).toEqual({ blast: true })
  })

  it('parses hazardous', () => {
    expect(parseWeaponKeywords('hazardous')).toEqual({ hazardous: true })
  })

  it('parses heavy', () => {
    expect(parseWeaponKeywords('heavy')).toEqual({ heavy: true })
  })

  it('parses assault', () => {
    expect(parseWeaponKeywords('assault')).toEqual({ assault: true })
  })

  it('parses lance', () => {
    expect(parseWeaponKeywords('lance')).toEqual({ lance: true })
  })

  it('parses indirect fire', () => {
    expect(parseWeaponKeywords('indirect fire')).toEqual({ indirectFire: true })
  })

  it('parses precision', () => {
    expect(parseWeaponKeywords('precision')).toEqual({ precision: true })
  })

  it('parses pistol', () => {
    expect(parseWeaponKeywords('pistol')).toEqual({ pistol: true })
  })

  it('parses ignores cover', () => {
    expect(parseWeaponKeywords('ignores cover')).toEqual({ ignoresCover: true })
  })

  it('parses one shot', () => {
    expect(parseWeaponKeywords('one shot')).toEqual({ oneShot: true })
  })

  it('parses extra attacks', () => {
    expect(parseWeaponKeywords('extra attacks')).toEqual({ extraAttacks: true })
  })

  it('parses conversion', () => {
    expect(parseWeaponKeywords('conversion')).toEqual({ conversion: true })
  })

  // --- AC #4: parametric keywords ---
  it('parses sustained hits with number', () => {
    expect(parseWeaponKeywords('sustained hits 2')).toEqual({ sustainedHits: 2 })
  })

  it('parses sustained hits 1', () => {
    expect(parseWeaponKeywords('sustained hits 1')).toEqual({ sustainedHits: 1 })
  })

  it('parses sustained hits with dice notation', () => {
    expect(parseWeaponKeywords('sustained hits d3')).toEqual({ sustainedHits: 'd3' })
  })

  it('parses rapid fire with number', () => {
    expect(parseWeaponKeywords('rapid fire 1')).toEqual({ rapidFire: 1 })
  })

  it('parses rapid fire with dice notation', () => {
    expect(parseWeaponKeywords('rapid fire d6')).toEqual({ rapidFire: 'd6' })
  })

  it('parses rapid fire with dice+modifier', () => {
    expect(parseWeaponKeywords('rapid fire d6+3')).toEqual({ rapidFire: 'd6+3' })
  })

  it('parses melta with number', () => {
    expect(parseWeaponKeywords('melta 2')).toEqual({ melta: 2 })
  })

  it('parses melta 3', () => {
    expect(parseWeaponKeywords('melta 3')).toEqual({ melta: 3 })
  })

  // --- AC #4: anti-X ---
  it('parses anti-vehicle 4+', () => {
    expect(parseWeaponKeywords('anti-vehicle 4+')).toEqual({
      anti: [{ keyword: 'vehicle', threshold: 4 }],
    })
  })

  it('parses anti-infantry 3+', () => {
    expect(parseWeaponKeywords('anti-infantry 3+')).toEqual({
      anti: [{ keyword: 'infantry', threshold: 3 }],
    })
  })

  it('parses anti-psyker 2+', () => {
    expect(parseWeaponKeywords('anti-psyker 2+')).toEqual({
      anti: [{ keyword: 'psyker', threshold: 2 }],
    })
  })

  it('parses anti-fly 2+', () => {
    expect(parseWeaponKeywords('anti-fly 2+')).toEqual({
      anti: [{ keyword: 'fly', threshold: 2 }],
    })
  })

  it('parses anti-monster 4+', () => {
    expect(parseWeaponKeywords('anti-monster 4+')).toEqual({
      anti: [{ keyword: 'monster', threshold: 4 }],
    })
  })

  // --- AC #5: case insensitivity ---
  it('parses UPPERCASE keywords', () => {
    expect(parseWeaponKeywords('ANTI-VEHICLE 2+, PISTOL')).toEqual({
      anti: [{ keyword: 'vehicle', threshold: 2 }],
      pistol: true,
    })
  })

  it('parses Mixed Case keywords', () => {
    expect(parseWeaponKeywords('Anti-Vehicle 4+, Devastating Wounds')).toEqual({
      anti: [{ keyword: 'vehicle', threshold: 4 }],
      devastatingWounds: true,
    })
  })

  it('parses LETHAL HITS in caps', () => {
    expect(parseWeaponKeywords('LETHAL HITS')).toEqual({ lethalHits: true })
  })

  // --- Combo tests (real data) ---
  it('parses "sustained hits 2, ignores cover" (Gauss)', () => {
    expect(parseWeaponKeywords('sustained hits 2, ignores cover')).toEqual({
      sustainedHits: 2,
      ignoresCover: true,
    })
  })

  it('parses "assault, ignores cover, torrent, twin-linked" (Penitent flamers)', () => {
    expect(parseWeaponKeywords('assault, ignores cover, torrent, twin-linked')).toEqual({
      assault: true,
      ignoresCover: true,
      torrent: true,
      twinLinked: true,
    })
  })

  it('parses "anti-psyker 2+, devastating wounds, precision, rapid fire 1" (Condemnor boltgun)', () => {
    expect(parseWeaponKeywords('anti-psyker 2+, devastating wounds, precision, rapid fire 1')).toEqual({
      anti: [{ keyword: 'psyker', threshold: 2 }],
      devastatingWounds: true,
      precision: true,
      rapidFire: 1,
    })
  })

  it('parses "melta 2, pistol" (Inferno pistol)', () => {
    expect(parseWeaponKeywords('melta 2, pistol')).toEqual({
      melta: 2,
      pistol: true,
    })
  })

  it('parses "hazardous, pistol" (Plasma pistol supercharge)', () => {
    expect(parseWeaponKeywords('hazardous, pistol')).toEqual({
      hazardous: true,
      pistol: true,
    })
  })

  it('parses "blast, rapid fire d6+3" (Rapid-fire battle cannon)', () => {
    expect(parseWeaponKeywords('blast, rapid fire d6+3')).toEqual({
      blast: true,
      rapidFire: 'd6+3',
    })
  })

  it('parses "ignores cover, one shot, torrent" (Brazier of holy fire)', () => {
    expect(parseWeaponKeywords('ignores cover, one shot, torrent')).toEqual({
      ignoresCover: true,
      oneShot: true,
      torrent: true,
    })
  })

  it('parses "sustained hits 1, twin-linked"', () => {
    expect(parseWeaponKeywords('sustained hits 1, twin-linked')).toEqual({
      sustainedHits: 1,
      twinLinked: true,
    })
  })

  // --- Multiple anti-X ---
  it('parses multiple anti-X keywords', () => {
    expect(parseWeaponKeywords('anti-vehicle 4+, anti-infantry 3+')).toEqual({
      anti: [
        { keyword: 'vehicle', threshold: 4 },
        { keyword: 'infantry', threshold: 3 },
      ],
    })
  })

  // --- Edge cases ---
  it('handles extra whitespace around commas', () => {
    expect(parseWeaponKeywords('  blast ,  torrent  , heavy  ')).toEqual({
      blast: true,
      torrent: true,
      heavy: true,
    })
  })

  it('handles trailing comma', () => {
    expect(parseWeaponKeywords('pistol,')).toEqual({ pistol: true })
  })

  it('ignores unknown keywords silently', () => {
    expect(parseWeaponKeywords('pistol, some_unknown_thing, blast')).toEqual({
      pistol: true,
      blast: true,
    })
  })

  it('ignores completely unknown text', () => {
    expect(parseWeaponKeywords('not a real keyword')).toEqual({})
  })
})
