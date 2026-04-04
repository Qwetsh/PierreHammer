# Story 5.2: Header de liste et compteur de points

Status: review

## Story

As a joueur,
I want voir en permanence le nom, la faction, le détachement et le total de points de ma liste,
so that je sache toujours où j'en suis pendant la construction.

## Acceptance Criteria

1. ArmyListHeader sticky (48px) affiche nom, faction, détachement et PointsCounter (UX-DR12)
2. PointsCounter affiche current/limit en JetBrains Mono 20px (UX-DR9)
3. Compteur vert ok, orange warning >90%, rouge error >100% (FR15)
4. aria-live="polite" pour l'accessibilité
5. Header reste visible pendant le scroll

## Tasks / Subtasks

- [x] Task 1 (AC: #2, #3, #4): Créer src/components/domain/PointsCounter/
  - [x] PointsCounter.tsx avec colors vert/orange/rouge, font-mono, aria-live, pulse animation
  - [x] PointsCounter.test.tsx (6 tests), index.ts
- [x] Task 2 (AC: #1, #5): Créer src/components/domain/ArmyListHeader/
  - [x] Sticky, 48px, bg-surface, nom + faction + détachement + PointsCounter
- [x] Task 3: Créer src/utils/pointsCalculator.ts
  - [x] calculateTotalPoints pure function
- [x] Task 4: Intégrer dans ListDetailPage
  - [x] Route: /lists/:listId, ArmyListHeader, liste des unités, alerte dépassement

## Dev Notes

- CRITICAL: Le PointsCounter doit utiliser font-family: var(--font-mono) (JetBrains Mono)
- CRITICAL: Le header doit rester sticky pendant le scroll — position: sticky + top: 0
- Le calcul de points est un simple sum — chaque ListUnit a déjà son coût en points
- L'animation pulse utilise les keyframes CSS de Story 1.4

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR9 PointsCounter]
- [Source: planning-artifacts/ux-design-specification.md#UX-DR12 ArmyListHeader]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- PointsCounter: JetBrains Mono, 3 couleurs (success/warning/error), pulse animation, aria-live="polite"
- ArmyListHeader: sticky top-0 48px, affiche nom/faction/détachement + PointsCounter
- ListDetailPage: route /lists/:listId, header + liste units + alerte dépassement + EmptyState
- App.tsx: route /lists/:listId mise à jour vers ListDetailPage
### File List
- src/components/domain/PointsCounter/PointsCounter.tsx (new)
- src/components/domain/PointsCounter/PointsCounter.test.tsx (new)
- src/components/domain/PointsCounter/index.ts (new)
- src/components/domain/ArmyListHeader/ArmyListHeader.tsx (new)
- src/components/domain/ArmyListHeader/index.ts (new)
- src/utils/pointsCalculator.ts (new)
- src/pages/Lists/ListDetailPage.tsx (new)
- src/App.tsx (modified)
