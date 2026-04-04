# Story 5.1: Création, nommage et suppression de listes

Status: review

## Story

As a joueur,
I want créer, nommer et supprimer des listes d'armée,
so that je prépare mes différentes configurations avant une partie.

## Acceptance Criteria

1. Le joueur peut donner un nom personnalisé à une nouvelle liste (FR11)
2. Il sélectionne une faction via le FactionPicker (FR12, UX-DR11)
3. Il sélectionne un détachement parmi ceux disponibles pour la faction (FR12)
4. Il choisit une limite de points (1000/2000/3000)
5. Liste sauvegardée dans le listsStore (Zustand)
6. Il peut supprimer une liste existante avec confirmation (bouton danger)
7. Il peut gérer plusieurs listes simultanément (FR17)
8. Si aucune liste, état vide avec CTA "Créer ma première liste"

## Tasks / Subtasks

- [x] Task 1 (AC: #5): Créer src/types/armyList.types.ts
  - [x] ArmyList, ListUnit, PointsLimit types
  - [x] Détachement: champ texte libre (données non disponibles dans le JSON Wahapedia)
- [x] Task 2 (AC: #5, #7): Créer src/stores/listsStore.ts
  - [x] State: lists: Record<string, ArmyList>
  - [x] Actions: createList, deleteList, getList, getAllLists, addUnit, removeUnit, updateList
  - [x] Persist: name 'pierrehammer-lists'
  - [x] ID generation: Date.now().toString(36) + random suffix
- [x] Task 3 (AC: #1-#4): Créer un flow de création de liste dans ListsPage
  - [x] Formulaire: nom, faction (FactionPicker avec selectedSlug), détachement (texte), limite de points (segmented)
  - [x] Bouton "Créer" (primary)
- [x] Task 4 (AC: #6): Suppression de liste
  - [x] Bouton danger "Supprimer" avec confirmation inline
- [x] Task 5 (AC: #7): Afficher toutes les listes
  - [x] ListsPage montre toutes les listes avec nom, faction, points current/limit
  - [x] Tap sur une liste → navigate vers /lists/:listId
- [x] Task 6 (AC: #8): État vide
  - [x] EmptyState: "Pas encore de liste ?" + CTA "Créer ma première liste"

## Dev Notes

- CRITICAL: listsStore DOIT utiliser persist middleware avec name 'pierrehammer-lists'
- Les détachements sont dans les données de faction JSON (à vérifier la structure exacte du CSV Wahapedia)
- Si les détachements ne sont pas dans le JSON, créer un champ texte libre pour l'instant
- Le FactionPicker existe déjà (Story 3.1) — le réutiliser dans le formulaire de création

### References
- [Source: planning-artifacts/architecture.md#stores/listsStore.ts]
- [Source: planning-artifacts/ux-design-specification.md#UX-DR11 FactionSelector]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- listsStore: persist 'pierrehammer-lists', CRUD + addUnit/removeUnit/updateList pré-implémentés pour stories suivantes
- FactionPicker: ajout prop selectedSlug avec border visuelle
- ListsPage: formulaire de création complet, liste des listes avec delete confirm, EmptyState
- Détachement en texte libre car les données Wahapedia ne fournissent pas cette info
### File List
- src/types/armyList.types.ts (new)
- src/stores/listsStore.ts (new)
- src/stores/listsStore.test.ts (new)
- src/pages/Lists/ListsPage.tsx (rewritten)
- src/components/domain/FactionPicker/FactionPicker.tsx (modified)
