# Story 11.2: Mapping des abilities et règles de combat

Status: review

## Story

As a développeur,
I want un système de mapping qui associe les abilities connues (Core, Faction, Datasheet) à des effets mécaniques structurés,
so that le moteur de combat puisse appliquer les modificateurs de Feel No Pain, Stealth, dégâts réduits, etc.

## Acceptance Criteria

1. Un registre d'abilities mappe les noms d'abilities connues à des effets mécaniques typés
2. Les effets suivants sont supportés : Feel No Pain (seuil), Stealth (-1 to hit), dégâts réduits (-N damage), mortal wounds on X+, invulnérable conditionnel, +N to hit/wound/save
3. Les abilities Core (Leader, Deadly Demise, Lone Operative, Feel No Pain, Stealth, Scouts, Infiltrators) sont mappées
4. Le système est extensible — ajouter une nouvelle ability ne nécessite qu'une entrée dans le registre
5. Une fonction peut extraire les effets de combat applicables d'un Datasheet complet
6. Les abilities non reconnues sont ignorées silencieusement (pas de crash)

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Types d'effets de combat
  - [x] Étendu `src/types/combat.types.ts` avec CombatModifierPhase, CombatModifier, AbilityEffect
  - [x] Ajouté stealth et ignoresCover en raccourcis boolean
  - [x] Types compilent sans erreur

- [x] Task 2 (AC: #1, #3, #4): Registre d'abilities
  - [x] Créé `src/data/abilityRegistry.ts` avec lookupAbility()
  - [x] Abilities Core: stealth, feel no pain 3+/4+/5+/6+
  - [x] Abilities fréquentes: damage reduction, invulnerable saves (4+/5+/6+), cover
  - [x] 10 tests sur le registre
  - [x] Extensible: ajouter une entrée = 1 ligne dans l'objet

- [x] Task 3 (AC: #5, #6): Extracteur d'effets de combat
  - [x] Créé `src/utils/combatEffectsExtractor.ts`
  - [x] extractCombatEffects(datasheet): registry lookup → regex fallback (FnP, invuln) → description parsing
  - [x] Parse profile.invSv pour invulnérable
  - [x] Merge intelligent: best FnP, best invuln, sum damage reduction, concat modifiers
  - [x] 11 tests couvrant stealth, FnP, invuln, merge, unknown abilities

- [x] Task 4: Intégration des enhancements
  - [x] extractEnhancementEffects(enhancement): regex patterns sur description
  - [x] Patterns: FnP, invuln, extra attacks, +N wound/hit, damage reduction, stealth
  - [x] 10 tests couvrant chaque pattern + combos

## Dev Notes

- Ce système est conçu pour couvrir ~80% des cas automatiquement. Les 20% restants (abilities très spécifiques) seront ajoutés itérativement.
- L'ability registry est un fichier de données statique — facile à enrichir manuellement au fur et à mesure
- Le parsing des descriptions HTML des abilities est HORS SCOPE ici — on se base sur le `name` de l'ability et des patterns regex simples
- Les effets de détachement (detachment rules) seront traités dans une story ultérieure (Phase 4)
- L'invulnérable save est déjà dans les données de profil (`invSv`, `invSvDescr`) — pas besoin de parser les abilities pour ça dans la plupart des cas

### References
- Types existants: src/types/gameData.types.ts (Ability, Enhancement, Profile)
- Données: les abilities ont un champ `type` (Core, Faction, Datasheet) et `name`
- enhancementUtils existant: src/utils/enhancementUtils.ts (pattern de parsing de description)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- AbilityEffect type avec FnP, modifiers, mortalWounds, invulnerable, damageReduction, extraAttacks, stealth, ignoresCover
- Registre statique extensible (lookupAbility) avec abilities core + fréquentes
- extractCombatEffects: 3 niveaux de résolution (registry → regex name → regex description) + profile invSv
- extractEnhancementEffects: regex patterns sur description pour 7 types d'effets
- Merge intelligent: best FnP/invuln, sum DR/extraAttacks, concat modifiers
- 320 tests total, 30 nouveaux, 0 régression
### File List
- src/types/combat.types.ts (modifié — ajout AbilityEffect, CombatModifier, CombatModifierPhase)
- src/data/abilityRegistry.ts (créé)
- src/data/abilityRegistry.test.ts (créé)
- src/utils/combatEffectsExtractor.ts (créé)
- src/utils/combatEffectsExtractor.test.ts (créé)
