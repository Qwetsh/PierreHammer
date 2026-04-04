# Story 2.2: Parsing des CSV et liaison par identifiants

Status: review

## Story

As a développeur (Thomas),
I want que les CSV soient parsés et liés entre eux par identifiants,
so that les données forment un modèle cohérent exploitable par l'app.

## Acceptance Criteria

1. Les fichiers Factions, Datasheets, Abilities, Keywords, Models, Wargear et Datasheets_points sont parsés (FR2)
2. Les datasheets sont liées à leur faction, abilities, keywords, models, wargear et points par identifiants
3. Les données invalides ou manquantes sont signalées avec des messages d'erreur clairs (NFR12)
4. Le parsing complet s'exécute en moins de 2 minutes pour toutes les factions (NFR11)

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Créer pipeline/src/types.ts
  - [x] Définir les types TypeScript: RawFaction, RawDatasheet, RawAbility, RawKeyword, RawModel, RawWargear, RawPoints
  - [x] Définir les types transformés: Faction, Datasheet, Ability, Keyword, Profile, Weapon, PointOption
- [x] Task 2 (AC: #1): Créer pipeline/src/parse.ts
  - [x] Utiliser csv-parse (streaming) pour parser chaque fichier CSV
  - [x] Gérer les encodages et séparateurs Wahapedia (pipe | pour certains champs)
  - [x] Créer une fonction par type de CSV: parseFactions(), parseDatasheets(), etc.
- [x] Task 3 (AC: #2): Lier les entités entre elles
  - [x] Datasheets → Faction par faction_id
  - [x] Abilities → Datasheet par datasheet_id
  - [x] Keywords → Datasheet par datasheet_id
  - [x] Wargear → Datasheet par datasheet_id
  - [x] Points → Datasheet par datasheet_id
  - [x] Models (profils) → Datasheet par datasheet_id
- [x] Task 4 (AC: #3): Validation et erreurs
  - [x] Vérifier que chaque datasheet a au moins une faction
  - [x] Vérifier que chaque référence par ID existe
  - [x] Log les orphelins: "Warning: Ability 'xxx' référence datasheet_id 'yyy' inexistant"
  - [x] Compter les erreurs et warnings dans le résumé
- [x] Task 5 (AC: #4): Performance
  - [x] Parser en streaming (pas tout charger en mémoire)
  - [x] Mesurer et afficher le temps d'exécution

## Dev Notes

- CRITICAL: Les CSV Wahapedia utilisent des séparateurs variés. Certains champs contiennent des pipes | pour les listes (ex: keywords). Analyser les CSV réels avant d'implémenter.
- CRITICAL: Les IDs dans les CSV Wahapedia sont numériques mais on les stocke comme strings dans notre modèle
- Le champ "faction_id" lie les datasheets aux factions. Certaines unités peuvent être dans plusieurs factions (ex: Agents of the Imperium)
- csv-parse est la librairie recommandée (streaming, robuste). Installer avec: npm install csv-parse
- Les fichiers CSV Wahapedia peuvent contenir du HTML dans certains champs (descriptions d'abilities) — le conserver tel quel pour l'affichage

### References
- [Source: planning-artifacts/architecture.md#Data Architecture]
- [Source: planning-artifacts/architecture.md#Format Patterns - Données de jeu]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- ✅ Types Raw + Transformed pour les 7 entités CSV (Faction, Datasheet, Ability, Keyword, Model/Profile, Wargear/Weapon, Points)
- ✅ Parsing streaming avec csv-parse, séparateur pipe | (format Wahapedia)
- ✅ Liaison complète: Datasheets liées à Faction, Abilities, Keywords, Wargear, Models, Points par IDs
- ✅ Validation: factions orphelines, datasheets sans faction, références d'IDs invalides
- ✅ Messages d'erreur/warning clairs avec compteur et résumé
- ✅ Mesure du temps d'exécution affichée
- ✅ Commande `parse` ajoutée au CLI
- ✅ 36 tests React passent, 0 régressions

### File List
- pipeline/src/types.ts (nouveau — types Raw + Transformed)
- pipeline/src/parse.ts (nouveau — parsing, liaison, validation)
- pipeline/src/index.ts (modifié — ajout commande parse)

### Change Log
- 2026-04-01: Story 2.2 implémentée — parsing CSV streaming avec liaison d'entités par identifiants et validation
