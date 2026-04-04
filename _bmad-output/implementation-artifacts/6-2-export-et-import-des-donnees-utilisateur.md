# Story 6.2: Export et import des données utilisateur

Status: review

## Story

As a joueur,
I want exporter mes données en fichier JSON et les réimporter,
so that je puisse sauvegarder mes données, les transférer ou les restaurer.

## Acceptance Criteria

1. Bouton "Exporter" dans Profil télécharge un fichier JSON (FR32)
2. L'intégrité des données est validée avant import (NFR9)
3. Si valides, elles remplacent les données existantes (FR33)
4. Si invalides, message d'erreur clair et données existantes non modifiées
5. Toast de confirmation après import réussi

## Tasks / Subtasks

- [x] Task 1: Créer src/hooks/useExportImport.ts
  - [x] exportData(): collecte les 3 stores, crée un blob JSON, déclenche le téléchargement
  - [x] Format export: { version: 1, exportedAt: ISO date, collection: {...}, lists: {...}, preferences: {...} }
  - [x] Nom du fichier: pierrehammer-backup-YYYY-MM-DD.json
- [x] Task 2: importData(file: File)
  - [x] Lire le fichier avec FileReader
  - [x] Parser le JSON
  - [x] Valider la structure (src/utils/storageValidator.ts)
- [x] Task 3: Créer src/utils/storageValidator.ts
  - [x] validateExportData(data): vérifie version, structure collection, structure lists
  - [x] Retourne { valid: boolean, errors: string[] }
  - [x] Vérifications: chaque CollectionItem a datasheetId + quantity + paintStatus, chaque ArmyList a id + name + factionId + units
- [x] Task 4: Intégrer dans ProfilePage
  - [x] Bouton "Exporter mes données" (secondary)
  - [x] Bouton "Importer mes données" (secondary) + input file hidden
  - [ ] Afficher la date du dernier export si connue
- [x] Task 5 (AC: #5): Feedback utilisateur
  - [x] Toast succès: "Données importées avec succès !"
  - [x] Toast erreur: "Fichier invalide: {détails}" + données existantes préservées

## Dev Notes

- CRITICAL: TOUJOURS valider avant d'écraser les données existantes (NFR9)
- L'export utilise URL.createObjectURL + <a download> pour déclencher le téléchargement
- L'import utilise un <input type="file" accept=".json"> caché, déclenché par le bouton
- En cas d'erreur d'import, les stores ne sont PAS modifiés — rollback implicite

### References
- [Source: planning-artifacts/architecture.md#Process Patterns - Gestion d'erreurs]
- [Source: planning-artifacts/architecture.md#hooks/useExportImport.ts]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- storageValidator avec 6 tests couvrant validation version, collection items, lists, objets vides
- useExportImport hook: export via Blob/createObjectURL, import avec validation puis setState
- ProfilePage réécrite avec boutons export/import, compteurs collection/listes, Toast feedback
- ToastProvider ajouté dans App.tsx wrapping AppShell
- 116 tests passent, type check OK
- Note: "Afficher la date du dernier export" non implémenté (non critique, pas de store dédié)
### File List
- src/utils/storageValidator.ts (créé)
- src/utils/storageValidator.test.ts (créé)
- src/hooks/useExportImport.ts (créé)
- src/pages/Profile/ProfilePage.tsx (réécrit)
- src/App.tsx (modifié - ToastProvider)
