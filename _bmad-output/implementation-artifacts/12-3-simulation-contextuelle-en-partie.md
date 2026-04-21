# Story 12.3: Simulation contextuelle en partie (attaque contre escouade adverse)

Status: review

## Story

As a joueur en partie contre un ami,
I want cliquer sur une de mes escouades et choisir "simuler une attaque contre..." puis sélectionner une escouade adverse,
so that j'obtienne instantanément les stats de réussite sans rien configurer manuellement.

## Acceptance Criteria

1. En game session, chaque unité de ma liste a un bouton "Attaquer..."
2. Au clic, la liste des escouades adverses (vivantes) est proposée
3. Le joueur sélectionne une cible adverse — la simulation se lance automatiquement
4. L'arme est présélectionnée intelligemment (arme avec le plus de dégâts attendus contre cette cible)
5. Le joueur peut changer l'arme manuellement
6. Les résultats tiennent compte des pertes actuelles (modèles vivants, blessures)
7. Les résultats tiennent compte des enhancements équipés sur l'attaquant et le défenseur
8. Zero configuration manuelle requise — tout est déduit des données en mémoire

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Flow d'attaque contextuelle
  - [x] Bouton "Attaquer" sur chaque unité avec armes (session active uniquement)
  - [x] Au clic → modal avec la liste des escouades adverses vivantes
  - [x] Escouades à 0 modèle filtrées (détruites masquées)
  - [x] Affichage: nom, modèles vivants, profil résumé (T/Sv/W)

- [x] Task 2 (AC: #3, #4, #8): Simulation automatique
  - [x] À la sélection de la cible, construction automatique du CombatInput
  - [x] Arme best-fit via findBestWeapon (max damageAfterFnp)
  - [x] extractCombatEffects + extractEnhancementEffects appliqués
  - [x] resolveCombat appelé, résultats affichés dans un overlay

- [x] Task 3 (AC: #4, #5): Sélection d'arme intelligente
  - [x] findBestWeapon teste toutes les armes et sélectionne la meilleure
  - [x] findBestWeaponByCategory sépare ranged/melee
  - [x] Arme la plus efficace présélectionnée avec indicateur "*"
  - [x] Le joueur peut changer via le sélecteur
  - [x] Tests: arme anti-char sélectionnée vs véhicule

- [x] Task 4 (AC: #6): Prise en compte des pertes
  - [x] attackerCount = modèles vivants (via casualties store)
  - [x] defenderCount = modèles vivants adverses (via opponentCasualties)
  - [x] Recalcul reactif via useMemo

- [x] Task 5 (AC: #7): Prise en compte des enhancements
  - [x] Enhancement attaquant et défenseur extraits du detachment
  - [x] extractEnhancementEffects appliqué et mergé
  - [x] Enhancements actifs affichés dans les résultats (badges)

- [x] Task 6 (AC: #8): UX zero-config
  - [x] 2 taps: "Attaquer" → sélectionner cible → résultats
  - [x] Overlay modal avec toutes les étapes détaillées + barres de progression
  - [x] Bouton "Changer de cible" pour revenir à la sélection
  - [x] Bouton "Fermer" pour quitter

## Dev Notes

- 2 taps → résultats complets. Feature killer.
- findBestWeapon résout N combats (un par arme) — négligeable avec ~5 armes max
- Enhancement lookup cherche dans tous les detachments de la faction
- ContextualSimulator component réutilisable, découplé de GameModePage

### References
- combatEngine: src/utils/combatEngine.ts (Story 11.3)
- weaponKeywordParser: src/utils/weaponKeywordParser.ts (Story 11.1)
- combatEffectsExtractor: src/utils/combatEffectsExtractor.ts (Story 11.2)
- gameSessionStore: src/stores/gameSessionStore.ts (Story 12.1)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- findBestWeapon + findBestWeaponByCategory: sélection d'arme optimale par résolution de combat comparatif
- ContextualSimulator component: overlay modal complet avec sélecteur d'arme, résultats détaillés, barres de progression, badges enhancements
- GameModePage: bouton "Attaquer" sur chaque unité (session), target picker filtrant les unités détruites, intégration ContextualSimulator
- mergeEffects helper pour combiner datasheet + enhancement effects
- Enhancement lookup dans les detachments de la faction
- 411 tests total, 6 nouveaux, 0 régression
### File List
- src/utils/findBestWeapon.ts (créé)
- src/utils/findBestWeapon.test.ts (créé)
- src/components/domain/ContextualSimulator/ContextualSimulator.tsx (créé)
- src/pages/GameMode/GameModePage.tsx (modifié — bouton Attaquer, target picker, ContextualSimulator)
