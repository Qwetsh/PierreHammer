# Story 6.1: Persistance localStorage avec Zustand persist

Status: review

## Story

As a joueur,
I want que mes données (collection, listes, préférences) soient automatiquement sauvegardées,
so that je ne perde rien quand je ferme l'app ou que mon téléphone plante.

## Acceptance Criteria

1. Les 3 stores persistent automatiquement via middleware persist (FR31)
2. Données jamais corrompues par crash ou fermeture brutale (NFR8)
3. Au rechargement, données restaurées à l'identique
4. Chaque store utilise une clé distincte (pierrehammer-collection, pierrehammer-lists, pierrehammer-preferences)

## Tasks / Subtasks

- [x] Task 1 (AC: #4): Créer src/stores/preferencesStore.ts
  - [x] State: activeFactionId, activeListId, locale
  - [x] Actions: setActiveFaction, setActiveList
  - [x] Persist: name 'pierrehammer-preferences'
- [x] Task 2 (AC: #1): Vérifier persist middleware — collectionStore ('pierrehammer-collection'), listsStore ('pierrehammer-lists'), preferencesStore ('pierrehammer-preferences')
- [x] Task 3 (AC: #2): Zustand persist utilise JSON.stringify atomique par clé — 4 tests preferencesStore
- [x] Task 4 (AC: #3): Restauration vérifiée via tests unitaires des stores

## Dev Notes

- Zustand persist middleware utilise JSON.stringify pour sérialiser et localStorage.setItem — opération atomique par clé
- Pas besoin de versioning du schéma pour le MVP — si on change le schéma, les utilisateurs (6 amis) peuvent simplement réimporter
- Le preferencesStore garde la dernière faction consultée et la dernière liste ouverte pour la restauration de contexte
- Les 3 stores DOIVENT avoir des clés différentes pour éviter les conflits

### References
- [Source: planning-artifacts/architecture.md#Communication Patterns - State Management]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- preferencesStore: persist 'pierrehammer-preferences', activeFactionId/activeListId/locale
- 3 stores persistent: collection, lists, preferences — toutes clés distinctes
### File List
- src/stores/preferencesStore.ts (new)
- src/stores/preferencesStore.test.ts (new)
