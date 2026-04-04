# Story 2.3: Génération des JSON optimisés par faction

Status: review

## Story

As a développeur (Thomas),
I want que les données parsées soient exportées en JSON optimisé — un fichier index + un fichier par faction,
so that l'app puisse charger les données par faction en lazy loading.

## Acceptance Criteria

1. Un fichier factions.json index léger est généré (liste des factions avec id, nom, nombre d'unités)
2. Un fichier {faction-id}.json est généré par faction avec toutes les datasheets, abilities, keywords, wargear et points
3. Les JSON sont écrits dans le dossier app public/data/ (intégrés au build, FR5)
4. La date de dernière mise à jour de Last_update.csv est incluse dans factions.json (FR3, FR4)
5. Un script unique `npm run pipeline` enchaîne download → parse → generate

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Créer pipeline/src/transform.ts — génération factions.json
  - [x] Générer: { lastUpdate, factions: [{ id, name, slug, datasheetCount }] }
  - [x] Inclure la date de Last_update.csv (AC: #4)
  - [x] Fichier léger
- [x] Task 2 (AC: #2): Générer un JSON par faction
  - [x] Format {slug}.json (kebab-case): space-marines.json, orks.json, etc.
  - [x] Contenu: { id, name, slug, datasheets: [...] }
  - [x] Tous les champs en camelCase
  - [x] IDs comme strings
- [x] Task 3 (AC: #3): Écrire les fichiers dans public/data/
  - [x] Créer le dossier public/data/ de l'app s'il n'existe pas
  - [x] Le chemin vers l'app est relatif: ../public/data/ depuis pipeline/
- [x] Task 4 (AC: #5): Script pipeline unifié
  - [x] Ajouter "pipeline" script dans package.json: npx tsx src/index.ts pipeline
  - [x] Séquence: download → parse → validate → generate
  - [x] Afficher le résumé: X factions, Y datasheets total, temps d'exécution
- [x] Task 5: Créer pipeline/src/validate.ts
  - [x] Valider le schéma JSON de sortie (chaque faction a au moins 1 datasheet, chaque datasheet a un nom et des points)
  - [x] Afficher un résumé de validation

## Dev Notes

- CRITICAL: Les noms de fichiers faction doivent être en kebab-case: space-marines.json, pas SpaceMarines.json
- CRITICAL: Les données doivent correspondre aux types TypeScript de l'app (src/types/gameData.types.ts sera créé dans Epic 3)
- Le factions.json index est chargé au démarrage de l'app. Il doit rester LÉGER (juste id, name, datasheetCount, lastUpdate)
- Chaque {faction}.json contient TOUT ce qui est nécessaire pour afficher les unités de cette faction — pas d'appel réseau supplémentaire
- Les fichiers vont dans public/data/ (servis statiquement par Vite, intégrés au build)

### References
- [Source: planning-artifacts/architecture.md#Data Architecture]
- [Source: planning-artifacts/architecture.md#Format Patterns]
- [Source: planning-artifacts/architecture.md#Project Structure - src/data/]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- ✅ factions.json index léger avec lastUpdate, id, name, slug, datasheetCount
- ✅ {slug}.json par faction en kebab-case avec toutes les datasheets liées
- ✅ Sortie dans public/data/ (chemin relatif depuis pipeline/)
- ✅ Pipeline unifié: download → parse → validate → generate
- ✅ Validation: factions sans datasheets, datasheets sans nom/points
- ✅ parseData() retourne ParseResult pour chaînage pipeline
- ✅ Résumé avec compteurs et temps d'exécution
- ✅ 36 tests React passent, 0 régressions

### File List
- pipeline/src/transform.ts (nouveau — génération JSON par faction)
- pipeline/src/validate.ts (nouveau — validation schéma)
- pipeline/src/parse.ts (modifié — parseData() retourne ParseResult)
- pipeline/src/index.ts (modifié — commandes generate, pipeline ajoutées)

### Change Log
- 2026-04-01: Story 2.3 implémentée — génération JSON par faction + pipeline unifié + validation
