# Story 4.1: Marquage de possession et quantité

Status: review

## Story

As a joueur,
I want marquer une unité comme possédée et définir combien j'en ai,
so that l'app sache ce que j'ai dans ma vitrine.

## Acceptance Criteria

1. Badge de possession apparaît sur la UnitCard quand possédée
2. Le joueur peut définir la quantité possédée (1, 2, 3…)
3. Donnée stockée dans le collectionStore (Zustand)
4. La fiche UnitSheet affiche le nombre de figurines possédées (FR20)
5. Le joueur peut retirer une unité de sa collection

## Tasks / Subtasks

- [x] Task 1 (AC: #3): Créer src/types/collection.types.ts
  - [x] CollectionItem: { datasheetId: string, quantity: number, paintStatus: PaintStatus, factionId: string }
  - [x] PaintStatus enum: Unassembled, Assembled, InProgress, Completed
- [x] Task 2 (AC: #3): Créer src/stores/collectionStore.ts
  - [x] State: items: Record<string, CollectionItem>
  - [x] Actions: addItem(datasheetId, factionId, quantity), removeItem(datasheetId), updateQuantity(datasheetId, quantity), updateStatus(datasheetId, status)
  - [x] Persist middleware: name 'pierrehammer-collection'
  - [x] Sélecteurs: getItem(datasheetId), getOwnedCount(datasheetId), isOwned(datasheetId)
- [x] Task 3 (AC: #1): Mettre à jour UnitCard
  - [x] Ajouter un badge possession (petit indicateur visuel) quand owned > 0
  - [x] Afficher la quantité si > 1
  - [x] Lire depuis collectionStore via useCollectionStore
- [x] Task 4 (AC: #2, #5): Ajouter contrôles possession sur UnitSheet
  - [x] Bouton "Ajouter à ma collection" (ou +/-  pour quantité si déjà possédé)
  - [x] Contrôle de quantité: boutons - / quantité / +
  - [x] Bouton retirer (quantité → 0 = retirer de la collection)
- [x] Task 5 (AC: #4): Afficher possession sur UnitSheet
  - [x] Section dans le header de la fiche: "Possédé: X" ou "Non possédé"
  - [x] Visuellement distinct (badge ou couleur)

## Dev Notes

- CRITICAL: collectionStore DOIT utiliser le middleware persist avec name 'pierrehammer-collection'
- CRITICAL: Updates immuables dans le store: set((state) => ({ items: { ...state.items, [id]: newItem } }))
- Le PaintStatus sera exploité dans Story 4.2, mais le type est défini ici. Valeur par défaut: PaintStatus.Unassembled
- La lecture du store dans les composants utilise des sélecteurs fins: useCollectionStore((s) => s.items[datasheetId])

### References
- [Source: planning-artifacts/architecture.md#Communication Patterns - State Management]
- [Source: planning-artifacts/architecture.md#stores/collectionStore.ts]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- CollectionItem type réutilise PaintStatus de PaintStatusBadge (pas de duplication)
- collectionStore avec persist middleware 'pierrehammer-collection', immutable updates
- updateQuantity(id, 0) supprime automatiquement l'item de la collection
- CatalogPage branchée au collectionStore, passe owned à UnitCard
- UnitSheet: "Possédé: X" / "Non possédé" dans le header, contrôles +/- ou bouton "Ajouter à ma collection"
- UnitDetailPage: connecte collectionStore, paint cycle, add/update quantity
- 8 tests store + 7 nouveaux tests UnitSheet = 86 tests total passent
### File List
- src/types/collection.types.ts (new)
- src/stores/collectionStore.ts (new)
- src/stores/collectionStore.test.ts (new)
- src/components/domain/UnitSheet/UnitSheet.tsx (modified)
- src/components/domain/UnitSheet/UnitSheet.test.tsx (modified)
- src/pages/Catalog/CatalogPage.tsx (modified)
- src/pages/Catalog/UnitDetailPage.tsx (modified)
