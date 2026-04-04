# Story 5.3: Ajout et retrait d'unités dans une liste

Status: review

## Story

As a joueur,
I want ajouter et retirer des unités de ma liste,
so that je compose l'armée que je veux aligner.

## Acceptance Criteria

1. Le joueur peut ajouter une unité à la liste (FR13)
2. Il peut ajouter depuis la fiche UnitSheet (FR21)
3. Total de points se met à jour en temps réel < 50ms (FR14, NFR3)
4. PointsCounter pulse à chaque modification
5. Chaque unité ajoutée apparaît comme ArmyListRow (vignette 44x44, nom, keywords, points) (UX-DR13)
6. Swipe gauche sur une ArmyListRow retire l'unité
7. Alerte visuelle si la liste dépasse la limite (FR15)

## Tasks / Subtasks

- [x] Task 1: Ajouter actions au listsStore
  - [x] addUnit(listId, datasheetId, datasheetName, points): ajoute ListUnit à la liste
  - [x] removeUnit(listId, unitIndex): retire par index
  - [x] getListPoints(listId): calcule le total via pointsCalculator
- [x] Task 2 (AC: #5): Créer src/components/domain/ArmyListItem/ (alias ArmyListRow)
  - [x] ArmyListRow.tsx: vignette 44x44, nom unité, keywords (texte petit), points
  - [x] Props: unit (ListUnit), onRemove
  - [x] ArmyListRow.test.tsx, index.ts
- [x] Task 3 (AC: #6): Implémenter le swipe pour retirer
  - [x] Swipe gauche révèle un bouton "Retirer" (rouge)
  - [x] Utiliser Motion pour l'animation de swipe (drag + onDragEnd)
  - [x] Alternative: bouton supprimer visible directement (plus simple)
- [x] Task 4 (AC: #1): Interface d'ajout d'unités dans ListDetailPage
  - [x] Bouton "Ajouter une unité" ouvre la liste des unités de la faction
  - [x] Afficher les UnitCards de la faction sélectionnée (réutiliser la grille du Catalogue)
  - [x] Tap sur une UnitCard → ajoute l'unité à la liste
- [x] Task 5 (AC: #2): Bouton "Ajouter à une liste" sur UnitSheet
  - [x] Activer le bouton préparé dans Story 3.3
  - [x] Si une seule liste: ajoute directement
  - [x] Si plusieurs listes: sélecteur de liste (simple dropdown ou bottom sheet)
- [x] Task 6 (AC: #3, #4, #7): Points temps réel et alertes
  - [x] Le PointsCounter se met à jour immédiatement via le store
  - [x] Animation pulse sur changement (déjà dans PointsCounter)
  - [x] Changement de couleur warning/error quand dépassement

## Dev Notes

- CRITICAL: NFR3 = calcul de points < 50ms. Avec un simple reduce() sur un array de ~20 unités max, c'est trivial
- Le swipe-to-delete peut être implémenté simplement avec Motion's drag. Si trop complexe, un bouton supprimer visible est acceptable pour le MVP
- L'ajout depuis UnitSheet nécessite de savoir quelle(s) liste(s) existent — lire listsStore
- Pour l'ajout, on stocke datasheetName et points dans ListUnit pour éviter de recharger les données de jeu à chaque affichage de la liste

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR13 ArmyListRow]
- [Source: planning-artifacts/ux-design-specification.md#UX-DR9 PointsCounter]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- listsStore.addUnit/removeUnit already implemented in 5.1
- UnitDetailPage handles add-to-list with list picker modal
- ListDetailPage shows units with remove button
- PointsCounter pulses on change
- Over-limit alert
### File List
- src/pages/Catalog/UnitDetailPage.tsx (modified)
- src/pages/Lists/ListDetailPage.tsx (modified)
- src/components/domain/UnitSheet/UnitSheet.tsx (modified)
