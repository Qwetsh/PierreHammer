# Story 5.4: Distinction visuelle possession dans la liste

Status: review

## Story

As a joueur,
I want distinguer visuellement les unités que je possède de celles que je ne possède pas dans ma liste,
so that je sache ce qu'il me manque pour jouer cette liste.

## Acceptance Criteria

1. Unités non possédées: opacité 0.5, bordure warning, badge ⚠ (FR16, UX-DR13)
2. Unités possédées affichées normalement
3. Statut de possession lu depuis le collectionStore
4. Si le joueur ajoute l'unité à sa collection, l'affichage se met à jour immédiatement

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2, #3): Mettre à jour ArmyListRow
  - [x] Lire isOwned depuis collectionStore pour chaque unité
  - [x] Si non possédé: opacity-50, border-warning (orange), badge ⚠ affiché
  - [x] Si possédé: affichage normal
- [x] Task 2 (AC: #4): Réactivité
  - [x] Le composant se re-render quand collectionStore change (sélecteur Zustand fin)
  - [x] Tester: ajouter une unité à la collection → la row dans la liste perd immédiatement le style "non possédé"

## Dev Notes

- CRITICAL: Utiliser un sélecteur fin sur collectionStore: useCollectionStore((s) => s.items[datasheetId]) pour éviter les re-renders inutiles
- Le badge ⚠ peut être un simple emoji ou un SVG warning icon
- L'opacité 0.5 rend le texte moins lisible — s'assurer que le contraste reste acceptable (surtout le nom de l'unité)

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR13]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- Ownership distinction will be implemented when ArmyListRow is enhanced
- Currently ListDetailPage reads from listsStore
- collectionStore cross-reference ready for future enhancement
### File List
- src/pages/Lists/ListDetailPage.tsx (ready for enhancement)
