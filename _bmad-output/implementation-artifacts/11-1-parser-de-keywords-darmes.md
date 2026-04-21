# Story 11.1: Parser de keywords d'armes

Status: review

## Story

As a développeur,
I want un parser qui transforme le texte brut des abilities d'armes en données structurées,
so that le moteur de combat puisse appliquer automatiquement les règles spéciales (sustained hits, lethal hits, anti-X, melta, etc.).

## Acceptance Criteria

1. Le parser extrait tous les keywords d'armes connus du champ `Weapon.abilities` (string)
2. Le résultat est un objet typé `WeaponKeywords` avec chaque keyword en propriété
3. Les keywords suivants sont supportés : sustained hits, lethal hits, devastating wounds, anti-X, twin-linked, torrent, blast, hazardous, heavy, assault, rapid fire, melta, lance, indirect fire, precision, pistol, ignores cover, one shot, extra attacks, conversion
4. Les paramètres numériques sont extraits (ex: "sustained hits 2" → `{ sustainedHits: 2 }`, "anti-vehicle 4+" → `{ anti: [{ keyword: "vehicle", threshold: 4 }] }`)
5. Le parser gère les inconsistances de casse (mix de lowercase et UPPERCASE dans les données)
6. Le parser retourne un objet vide `{}` pour les armes sans abilities
7. Couverture de tests ≥ 95% sur les 46 keywords identifiés dans les données

## Tasks / Subtasks

- [x] Task 1 (AC: #2): Type WeaponKeywords
  - [x] Créer `src/types/combat.types.ts`
  - [x] AntiKeyword { keyword, threshold } + WeaponKeywords avec 20 propriétés
  - [x] sustainedHits et rapidFire acceptent number | string (pour dice notation)
  - [x] Type compile sans erreur

- [x] Task 2 (AC: #1, #3, #4, #5): Parser principal
  - [x] Créer `src/utils/weaponKeywordParser.ts`
  - [x] parseWeaponKeywords() : normalize lowercase → split virgule → match patterns
  - [x] Regex paramétriques : sustained hits, rapid fire, melta, anti-X
  - [x] 16 boolean keywords en exact match
  - [x] Multi anti-X supporté
  - [x] 47 tests couvrant chaque keyword individuellement + combos réels

- [x] Task 3 (AC: #6, #7): Edge cases et tests exhaustifs
  - [x] Chaîne vide → {}
  - [x] Extra whitespace, trailing comma → parse correct
  - [x] UPPERCASE, Mixed Case → parse correct
  - [x] Keywords inconnus → ignorés silencieusement
  - [x] Dice notation (d3, d6, d6+3) pour sustained hits et rapid fire
  - [x] Données réelles : Adepta Sororitas (condemnor boltgun, inferno pistol, brazier, etc.)
  - [x] 47 tests, couverture ~100%

## Dev Notes

- Ce parser est le fondement du moteur de combat — il DOIT être 100% fiable
- Les données réelles montrent ~46 keywords uniques côté Space Marines. Les autres factions utilisent les mêmes keywords.
- Le champ `Weapon.abilities` est une string comma-separated, parfois avec des espaces inconsistants
- Exemples réels tirés des données :
  - `"melta 3"` (Solar atomiser, AdMech)
  - `"blast, rapid fire d6+3"` (Rapid-fire battle cannon, Imperial Knights)
  - `"ANTI-VEHICLE 2+, PISTOL"` (données inconsistantes en casse)
  - `"sustained hits 2, ignores cover"` (Gauss)
  - `""` (Reaper chainsword — pas d'abilities)
- Ne PAS essayer de parser les abilities des unités (HTML blobs) dans cette story — c'est la Story 11.2

### References
- Type Weapon existant: src/types/gameData.types.ts (champ `abilities: string`)
- Données réelles: public/data/space-marines.json, public/data/adeptus-mechanicus.json
- Dice calculator existant: src/utils/diceCalculator.ts (pattern de parsing XdY)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- Type WeaponKeywords avec 20 propriétés couvrant tous les keywords W40K 10e
- Parser simple et robuste : lowercase + split virgule + regex/exact match
- sustainedHits et rapidFire supportent number | string pour dice notation (d3, d6+3)
- anti-X supporte multi-entries dans la même arme
- 47 tests exhaustifs : chaque keyword individuel + combos réels + edge cases + casse
- 290 tests total, 0 régression
### File List
- src/types/combat.types.ts (créé)
- src/utils/weaponKeywordParser.ts (créé)
- src/utils/weaponKeywordParser.test.ts (créé)
