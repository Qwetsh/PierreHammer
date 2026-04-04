# Story 2.1: Scaffolding du pipeline CLI et téléchargement des CSV

Status: review

## Story

As a développeur (Thomas),
I want un script CLI Node.js qui télécharge tous les fichiers CSV depuis Wahapedia,
so that je dispose des données brutes pour les transformer.

## Acceptance Criteria

1. Le dossier pipeline/ existe avec son propre package.json et tsconfig.json
2. Thomas peut exécuter `npm run download` dans pipeline/ pour télécharger les CSV
3. Tous les CSV Wahapedia nécessaires sont téléchargés (Factions, Datasheets, Abilities, Keywords, Models, Wargear, Datasheets_points, Last_update)
4. Les fichiers sont stockés dans pipeline/csv/
5. Message d'erreur clair si un téléchargement échoue ou si un CSV a un format inattendu (NFR12)
6. Le script affiche la progression du téléchargement

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Créer pipeline/ avec package.json
  - [x] npm init dans pipeline/
  - [x] Installer: typescript, tsx (pour exécuter TS directement), csv-parse
  - [x] Créer tsconfig.json (target ESNext, module NodeNext)
  - [x] Ajouter script "download" dans package.json
- [x] Task 2 (AC: #2, #3, #4): Créer pipeline/src/download.ts
  - [x] Définir les URLs Wahapedia CSV (https://wahapedia.ru/wh40k10ed/...)
  - [x] Télécharger chaque fichier avec fetch() natif Node.js 18+
  - [x] Sauvegarder dans pipeline/csv/
  - [x] Créer le dossier csv/ s'il n'existe pas
- [x] Task 3 (AC: #5): Gestion d'erreurs
  - [x] Vérifier le status HTTP de chaque téléchargement
  - [x] Vérifier que le contenu téléchargé ressemble à du CSV (contient des virgules/séparateurs)
  - [x] Messages d'erreur explicites: "Erreur téléchargement Datasheets.csv: HTTP 404"
- [x] Task 4 (AC: #6): Affichage progression
  - [x] Afficher "Téléchargement [X/N]: filename.csv..." pour chaque fichier
  - [x] Résumé final: "X/N fichiers téléchargés avec succès"
- [x] Task 5: Créer pipeline/src/index.ts comme point d'entrée CLI
  - [x] Parse des arguments CLI (download, parse, generate, pipeline, check-update)
  - [x] Router vers la bonne commande

## Dev Notes

- CRITICAL: Le pipeline est un projet SÉPARÉ de l'app React. Il a son propre package.json dans pipeline/
- Utiliser tsx (pas ts-node) pour exécuter TypeScript directement: npx tsx src/index.ts download
- Les URLs Wahapedia CSV sont publiques, pas besoin d'auth. Format: https://wahapedia.ru/wh40k10ed/TheData/Datasheets.csv
- Ajouter pipeline/csv/ au .gitignore du pipeline
- Node.js 18+ a fetch() natif, pas besoin d'installer node-fetch

### References
- [Source: planning-artifacts/architecture.md#Infrastructure & Deployment - Pipeline]
- [Source: planning-artifacts/prd.md#FR1-FR3]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- ✅ Pipeline séparé avec package.json, tsconfig.json, tsx pour exécution TS directe
- ✅ 8 CSV Wahapedia configurés (Factions, Datasheets, Abilities, Keywords, Models, Wargear, Datasheets_points, Last_update)
- ✅ Téléchargement séquentiel avec fetch() natif, sauvegarde dans pipeline/csv/
- ✅ Gestion d'erreurs: HTTP status, validation CSV, messages explicites
- ✅ Progression affichée: [X/N] + résumé final
- ✅ CLI avec routing de commandes (download, parse, generate, pipeline, check-update)
- ✅ pipeline/csv/ dans .gitignore
- ✅ TypeScript compile, CLI fonctionne, 36 tests React passent

### File List
- pipeline/package.json (nouveau)
- pipeline/tsconfig.json (nouveau)
- pipeline/.gitignore (nouveau)
- pipeline/src/index.ts (nouveau — point d'entrée CLI)
- pipeline/src/download.ts (nouveau — téléchargement CSV)

### Change Log
- 2026-04-01: Story 2.1 implémentée — pipeline CLI scaffoldé avec commande download pour les 8 CSV Wahapedia
