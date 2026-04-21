# Story 11.3: Moteur de résolution de combat W40K 10e édition

Status: review

## Story

As a joueur,
I want un moteur qui calcule automatiquement les résultats statistiques d'une attaque (hits, wounds, saves, dégâts),
so that je puisse savoir combien de dégâts mon escouade va infliger en moyenne sans calculer à la main.

## Acceptance Criteria

1. Le moteur prend en entrée : arme attaquante, profil attaquant, profil défenseur, nombre de modèles attaquants
2. Le moteur calcule la séquence complète W40K 10e : nombre d'attaques → hit roll → wound roll → save roll → dégâts → feel no pain
3. Le wound roll utilise la table correcte S vs T (S≥2T=2+, S>T=3+, S=T=4+, S<T=5+, S≤T/2=6+)
4. L'invulnérable save est utilisé automatiquement quand il est meilleur que l'armure modifiée par AP
5. Les keywords d'armes sont appliqués : sustained hits, lethal hits, devastating wounds, anti-X, twin-linked, torrent, blast, rapid fire, melta, lance, heavy, ignores cover
6. Les modificateurs d'abilities (FnP, Stealth, etc.) sont appliqués
7. Le résultat contient : hits moyens, wounds moyens, saves ratés moyens, dégâts moyens, kills estimés
8. Chaque étape intermédiaire est exposée pour l'affichage détaillé

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #8): Types d'entrée/sortie
  - [x] CombatInput avec weapon, profiles, counts, keywords, effects, toggles (halfRange, charged, stationary, inCover)
  - [x] CombatResult avec toutes les métriques + CombatSteps détaillé + mortalWounds
  - [x] Types compilent

- [x] Task 2 (AC: #3): Table de wound roll
  - [x] getWoundThreshold(S, T) avec table complète W40K 10e
  - [x] 6 tests edge cases (S≥2T, S>T, S=T, S<T, T≥2S, S=0)

- [x] Task 3 (AC: #2, #4): Pipeline de résolution de base
  - [x] resolveCombat(): 7 étapes (attacks → hit → wound → save → damage → FnP → kills)
  - [x] Invuln automatique quand meilleur que armure+AP
  - [x] Kills capped au nombre de défenseurs
  - [x] 26 tests d'intégration bout-en-bout

- [x] Task 4 (AC: #5): Application des keywords d'armes
  - [x] sustained hits, lethal hits, devastating wounds, anti-X, twin-linked, torrent, blast, rapid fire, melta, lance, heavy, ignores cover
  - [x] Tests pour chaque keyword

- [x] Task 5 (AC: #6): Application des ability effects
  - [x] FnP réduit les dégâts, stealth augmente hit threshold, damage reduction, ability invuln
  - [x] Modifiers attaquant/défenseur appliqués aux bonnes phases
  - [x] Tests FnP, stealth, DR

- [x] Task 6 (AC: #7): Helpers de parsing
  - [x] parseDiceNotation: "3"→3, "D6"→3.5, "2D6"→7, "D6+3"→6.5, "2D3+3"→7
  - [x] parseThreshold: "3+"→3, "N/A"→0
  - [x] 17 tests de parsing

## Dev Notes

- **CRITICAL**: Les règles de Warhammer 40K 10e édition sont la référence. Voici les règles clés :
  - Un 1 naturel rate TOUJOURS (hit, wound, save)
  - Un 6 naturel réussit TOUJOURS le hit et le wound (Critical Hit / Critical Wound)
  - Les modificateurs ne peuvent pas rendre un jet auto-réussi (max modifier: -1/+1 en 10e)
  - `anti-X N+` : les Critical Wounds (6+) sont obtenues sur N+ au lieu de 6+ si la cible a le keyword X
  - `sustained hits N` : chaque Critical Hit (6+) génère N hits supplémentaires (qui ne génèrent PAS de crits additionnels)
  - `lethal hits` : les Critical Hits (6+) blessent automatiquement (skip wound roll)
  - `devastating wounds` : les Critical Wounds deviennent des Mortal Wounds (skip save)
  - `twin-linked` : reroll des wound rolls ratés
  - `blast` : +1 attaque par 5 modèles dans l'unité cible
  - `torrent` : auto-hit (pas de hit roll)
  - `rapid fire N` : +N attaques si à demi-portée
  - `melta N` : +N damage si à demi-portée
  - `lance` : +1 wound roll si l'unité a chargé ce tour
  - `heavy` : +1 hit roll si l'unité n'a pas bougé
  - `ignores cover` : la cible ne bénéficie pas du bonus de couverture
- Le moteur calcule des MOYENNES statistiques, pas des simulations Monte Carlo. C'est plus rapide et suffisant pour l'usage.
- Pour rapid fire et melta (qui dépendent de la portée), on peut proposer un toggle "demi-portée" dans l'UI plus tard. Par défaut, on calcule la moyenne (50% chance d'être à demi-portée → bonus/2).
- `parseDiceNotation` peut réutiliser la logique de `calcAverageDice` dans diceCalculator.ts

### References
- weaponKeywordParser: src/utils/weaponKeywordParser.ts (Story 11.1)
- combatEffectsExtractor: src/utils/combatEffectsExtractor.ts (Story 11.2)
- diceCalculator existant: src/utils/diceCalculator.ts
- Types existants: src/types/gameData.types.ts (Weapon, Profile)
- Règles W40K 10e: Core Rules PDF (les mécaniques de base sont publiques)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- CombatInput/CombatResult/CombatSteps types complets avec toggles situationnels
- getWoundThreshold: table S vs T fidèle aux règles 10e
- resolveCombat: pipeline 7 étapes avec toutes les mécaniques W40K 10e
- Tous les keywords d'armes appliqués: sustained/lethal hits, devastating wounds, anti-X, twin-linked, torrent, blast, rapid fire, melta, lance, heavy, ignores cover
- AbilityEffects intégrés: FnP, stealth, damage reduction, invuln, modifiers par phase
- parseDiceNotation et parseThreshold: helpers robustes pour notation W40K
- Critical hits (6+) et critical wounds gérés correctement
- 365 tests total, 45 nouveaux, 0 régression
### File List
- src/types/combat.types.ts (modifié — ajout CombatInput, CombatResult, CombatSteps)
- src/utils/combatEngine.ts (créé)
- src/utils/combatEngine.test.ts (créé)
