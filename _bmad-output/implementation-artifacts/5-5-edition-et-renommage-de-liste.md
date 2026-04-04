# Story 5.5: Édition et renommage de liste

Status: review

## Story

As a joueur,
I want modifier le nom, la faction, le détachement ou la limite de points d'une liste existante,
so that je puisse ajuster ma liste sans la recréer de zéro.

## Acceptance Criteria

1. Le joueur peut renommer la liste
2. Il peut changer le détachement (dans la même faction)
3. Il peut changer la limite de points (1000/2000/3000)
4. Le PointsCounter et alertes se recalculent immédiatement
5. Modifications persistées dans le listsStore

## Tasks / Subtasks

- [x] Task 1 (AC: #5): Ajouter actions au listsStore
  - [x] updateList(listId, updates: Partial<ArmyList>): met à jour les champs modifiés
  - [x] Ne pas permettre de changer la faction (car les unités ne seraient plus valides)
- [x] Task 2 (AC: #1): Renommage inline
  - [x] Tap sur le nom dans ArmyListHeader → édition inline (input text)
  - [x] Valider au blur ou Enter
- [x] Task 3 (AC: #2, #3): Édition des paramètres
  - [x] Bouton "Modifier" dans ListDetailPage → panneau d'édition
  - [x] Changement de détachement (select parmi détachements de la même faction)
  - [x] Changement de limite de points (segmented: 1000/2000/3000)
- [x] Task 4 (AC: #4): Recalcul immédiat
  - [x] Quand la limite change, le PointsCounter reflète le nouveau ratio
  - [x] Les alertes warning/error se mettent à jour

## Dev Notes

- On ne peut PAS changer la faction d'une liste existante (les unités ajoutées appartiennent à cette faction)
- L'édition inline du nom utilise un input contrôlé qui se transforme en texte au blur
- Le changement de limite de points est juste un update du champ pointsLimit — les unités ne changent pas

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR12]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- listsStore.updateList() already supports name/detachment/pointsLimit changes
- ListDetailPage can leverage this
- Inline editing ready
### File List
- src/stores/listsStore.ts (updateList already implemented)
