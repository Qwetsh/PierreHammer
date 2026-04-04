# Story 9.2: Validation avancée de composition d'armée

Status: review

## Story

As a joueur compétitif,
I want que ma liste soit validée selon les règles W40K,
so that je sache si ma liste est légale avant d'arriver en tournoi.

## Acceptance Criteria

1. Une alerte s'affiche si plus de 6 unités BATTLELINE ou DEDICATED TRANSPORT sont présentes (FR18)
2. Une alerte s'affiche si plus de 3 Enhancements sont attribués (FR18)
3. Une alerte s'affiche si un Epic Hero est ajouté en double (FR18)
4. Les alertes de validation sont distinctes de l'alerte de dépassement de points
5. Un résumé de validation (valide/invalide avec détails) est accessible depuis le header de liste

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2, #3): Moteur de validation
  - [x] src/features/army-list/utils/validateArmyList.ts
  - [x] Règles: max 6 Battleline, max 6 Dedicated Transport, max 3 Enhancements, Epic Heroes uniques
  - [x] Retourne { valid: boolean, violations: Violation[] }
  - [x] Chaque Violation: type, message, severity ('error' | 'warning')
  - [x] 8 tests unitaires couvrant tous les cas
- [x] Task 2 (AC: #4): Alertes de validation distinctes
  - [x] Couleurs distinctes: error (rouge 15% opacity), warning (orange 15% opacity)
  - [x] Alertes positionnées sous le header, séparées de l'alerte de points
- [x] Task 3 (AC: #5): Résumé de validation dans le header
  - [x] Badge "Valide" (vert) / "Invalide" (rouge) dans ArmyListHeader
  - [x] Violations détaillées affichées en dessous du header
- [x] Task 4: Réactivité de la validation
  - [x] useMemo dans ListDetailPage, recalculé à chaque changement de liste/faction
  - [x] Validation informative, ne bloque pas l'ajout

## Dev Notes

- **CRITICAL**: Cette story est Phase 2 — ne pas bloquer l'ajout d'unités, juste informer
- Les keywords BATTLELINE, DEDICATED TRANSPORT, EPIC HERO viennent des données Wahapedia dans le JSON
- La validation doit être une pure function (testable unitairement sans composant)
- Le nombre max (6 Battleline, 3 Enhancements) peut varier selon les éditions — isoler les constantes
- Composants : `export function`, named exports, pas de `any`

### References
- [Source: planning-artifacts/prd.md#FR18]
- [Source: planning-artifacts/architecture.md#Features army-list]
- [Source: planning-artifacts/ux-design-specification.md#Army Builder]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- Pure function validateArmyList avec 4 règles de validation
- Constantes isolées (MAX_BATTLELINE, MAX_TRANSPORT, MAX_ENHANCEMENTS)
- ArmyListHeader enrichi avec badge Valide/Invalide et violations détaillées
- ListDetailPage intégré avec useMemo pour validation réactive
- 8 tests validateArmyList, 149 tests passent au total
### File List
- src/features/army-list/utils/validateArmyList.ts (créé)
- src/features/army-list/utils/validateArmyList.test.ts (créé)
- src/components/domain/ArmyListHeader/ArmyListHeader.tsx (réécrit - validation)
- src/pages/Lists/ListDetailPage.tsx (modifié - intégration validation)
