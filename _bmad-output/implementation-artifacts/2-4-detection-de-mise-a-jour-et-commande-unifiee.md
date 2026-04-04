# Story 2.4: Détection de mise à jour et commande unifiée

Status: review

## Story

As a développeur (Thomas),
I want détecter si les données Wahapedia ont changé avant de relancer le pipeline complet,
so that je ne relance le traitement que quand c'est nécessaire et que la mise à jour complète prend < 15 minutes.

## Acceptance Criteria

1. Thomas peut exécuter `npm run check-update` dans pipeline/ pour vérifier si les données ont changé
2. Le script compare la date de Last_update.csv distante avec celle stockée localement (FR3)
3. Si les données sont à jour, un message le confirme et le pipeline ne se relance pas
4. Si les données ont changé, le pipeline complet est relancé automatiquement
5. La mise à jour complète (pipeline + build) est réalisable en < 15 minutes (NFR13)

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Créer la commande check-update
  - [x] Télécharger uniquement Last_update.csv depuis Wahapedia
  - [x] Lire la date de la version précédente (stockée dans pipeline/.last-update)
  - [x] Comparer les dates
- [x] Task 2 (AC: #3): Message "à jour"
  - [x] "Les données sont à jour (dernière mise à jour: X). Aucune action nécessaire."
- [x] Task 3 (AC: #4): Relance automatique
  - [x] Si changement détecté: "Nouvelle mise à jour détectée ! Lancement du pipeline..."
  - [x] Exécuter la séquence complète: download → parse → validate → generate
- [x] Task 4 (AC: #5): Ajouter script npm
  - [x] "check-update" dans package.json
  - [x] Commandes documentées dans le help CLI

## Dev Notes

- Le fichier Last_update.csv de Wahapedia contient une seule ligne avec la date de dernière mise à jour
- Stocker la dernière date connue dans un fichier local pipeline/.last-update pour comparaison
- La mesure du temps total (pipeline + build app) peut être faite manuellement par Thomas
- Ce script est prévu pour un usage ~trimestriel (quand GW publie un nouveau MFM)

### References
- [Source: planning-artifacts/prd.md#FR3]
- [Source: planning-artifacts/architecture.md#Infrastructure & Deployment]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- ✅ Commande check-update compare Last_update.csv distant vs .last-update local
- ✅ Message "à jour" si dates identiques
- ✅ Relance automatique du pipeline complet si changement détecté
- ✅ Date sauvegardée dans .last-update après pipeline réussi
- ✅ Script npm "check-update" dans package.json
- ✅ .last-update dans .gitignore
- ✅ 36 tests React passent, 0 régressions

### File List
- pipeline/src/check-update.ts (nouveau — détection mise à jour + relance)
- pipeline/src/index.ts (modifié — ajout commande check-update)
- pipeline/.gitignore (modifié — ajout .last-update)

### Change Log
- 2026-04-01: Story 2.4 implémentée — détection de mise à jour avec comparaison de dates et relance automatique du pipeline
