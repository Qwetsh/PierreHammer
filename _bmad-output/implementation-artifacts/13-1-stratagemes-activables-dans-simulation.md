# Story 13.1: Stratagèmes activables dans la simulation

Status: review

## Story

As a joueur en partie,
I want activer un stratagème depuis le simulateur de combat et voir son effet sur les résultats,
so that je puisse évaluer si ça vaut le coup de dépenser mes PC avant de le faire sur la table.

## Acceptance Criteria

1. Dans le simulateur de combat (solo ou contextuel), une section "Stratagèmes" affiche les stratagèmes du détachement de l'attaquant
2. Les stratagèmes sont filtrés par phase pertinente (Shooting phase pour ranged, Fight phase pour melee)
3. Le joueur peut activer/désactiver un stratagème d'un tap
4. Les effets du stratagème activé sont appliqués au calcul de combat
5. Le coût en PC est affiché et le delta de résultat est montré (ex: "+2.3 dégâts pour 1 PC")
6. Les stratagèmes défensifs de l'adversaire sont aussi proposés (si en game session)

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Affichage des stratagèmes
  - [x] Section stratagèmes dans ContextualSimulator (filtrée par phase)
  - [x] Filtrage: shooting phase pour ranged, fight phase pour melee, any/command toujours
  - [x] Affichage: nom, coût PC, type
  - [x] Tests: filtrage par phase correct

- [x] Task 2 (AC: #3, #4): Parsing et application des effets
  - [x] stratagemEffectParser avec parseStratagemEffect et isStratagemRelevant
  - [x] Patterns: +1/-1 hit/wound/save, improve AP, FnP, +1 damage, -1 damage, invuln, stealth/cover
  - [x] HTML stripping
  - [x] Stratagèmes non parsables affichés en lecture seule
  - [x] Tests: 13 tests de parsing + 5 tests de filtrage

- [x] Task 3 (AC: #3, #4): Intégration dans le moteur de combat
  - [x] Stratagèmes actifs mergés dans attackerEffects/defenderEffects
  - [x] Recalcul instantané via useMemo réactif
  - [x] Cumul avec les autres modificateurs

- [x] Task 4 (AC: #5): Affichage du delta
  - [x] Calcul baseline (sans strats) vs résultat avec strats
  - [x] Affichage delta en vert/rouge: "+X.X dégâts avec stratagèmes"

- [x] Task 5 (AC: #6): Stratagèmes défensifs adverses
  - [x] Stratagèmes du détachement adverse passés en props
  - [x] Affichés avec préfixe "Def:" et couleur différente
  - [x] Activation modifie defenderEffects

## Dev Notes

- Parsing best-effort ~60% de couverture. Stratagèmes non parsés en lecture seule.
- Pas de tracking de PC — coût informatif seulement.
- Règle +1/-1 max en W40K 10e respectée par le moteur de combat.

### References
- combatEngine: src/utils/combatEngine.ts (Story 11.3)
- Types: src/types/gameData.types.ts (Stratagem)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- stratagemEffectParser: parsing best-effort des descriptions HTML, patterns pour +1/-1 hit/wound/save/damage, FnP, invuln, stealth, improve AP
- isStratagemRelevant: filtrage par phase (shooting/fight/any/command)
- ContextualSimulator étendu: section stratagèmes collapsible, toggle on/off, delta affiché, stratagèmes défensifs avec couleur distincte
- GameModePage passe les stratagèmes attaquant/défenseur au ContextualSimulator
- Baseline result calculé pour delta comparison
- 429 tests total, 18 nouveaux, 0 régression
### File List
- src/utils/stratagemEffectParser.ts (créé)
- src/utils/stratagemEffectParser.test.ts (créé)
- src/components/domain/ContextualSimulator/ContextualSimulator.tsx (modifié — stratagèmes)
- src/pages/GameMode/GameModePage.tsx (modifié — passe stratagèmes au simulateur)
