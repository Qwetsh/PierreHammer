# Story 10.2: Migration des army lists vers Supabase

Status: review

## Story

As a joueur connecté,
I want que mes listes d'armée soient sauvegardées en ligne,
so that je puisse les retrouver sur n'importe quel appareil et les partager avec d'autres joueurs.

## Acceptance Criteria

1. Les tables Supabase pour les army lists sont créées (migration SQL)
2. Le listsStore synchronise les listes vers Supabase quand l'utilisateur est connecté
3. Les listes locales (localStorage) sont migrées vers Supabase à la première connexion
4. En mode déconnecté, le localStorage reste le fallback (pas de perte de données)
5. Les opérations CRUD sur les listes fonctionnent en ligne et hors ligne
6. Un indicateur visuel montre si les listes sont synchronisées ou locales uniquement

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Schéma de base de données
  - [x] Migration SQL Supabase avec table army_lists (uuid PK, user_id FK, units JSONB, is_public, timestamps)
  - [x] RLS policies : select/insert/update/delete pour own lists + select pour public lists
  - [x] Index sur user_id et is_public (partial)
  - [x] Trigger auto updated_at
  - [x] Tests: structure SQL validée (6 tests)

- [x] Task 2 (AC: #2, #5): Service de synchronisation
  - [x] Créer src/services/listsSyncService.ts
  - [x] Méthodes: fetchRemoteLists, fetchPublicLists, pushList, updateRemoteList, deleteRemoteList, setListPublic
  - [x] Mapping bidirectionnel ArmyList ↔ table army_lists (toLocal/toRemote)
  - [x] Gestion d'erreurs : try/catch + console.error, return empty/null/false — jamais de crash
  - [x] Tests: 8 tests CRUD sync avec mock Supabase

- [x] Task 3 (AC: #2, #3): Intégration dans listsStore
  - [x] Pattern local-first : localStorage d'abord, sync Supabase en fire-and-forget
  - [x] Chaque mutation (create, delete, addUnit, removeUnit, update*, attach*, detach*, setEnhancement) sync si connecté
  - [x] syncOnLogin() : merge remote (autorité) + push local sans remoteId
  - [x] syncOnLogin appelé via authStore onAuthStateChange (lazy import pour éviter circular deps)
  - [x] Ajout champs remoteId et isPublic au type ArmyList
  - [x] Tests: 2 tests syncOnLogin (merge + no-op si non auth)

- [x] Task 4 (AC: #4): Fallback offline
  - [x] Aucun appel réseau si !isAuthenticated (guard dans getAuthContext)
  - [x] 216 tests passent sans Supabase configuré — 0 régression
  - [x] Build TypeScript propre (0 erreurs)

- [x] Task 5 (AC: #6): Indicateur de synchronisation
  - [x] Badge "Sync..." dans le header quand syncing=true (visible uniquement si connecté)
  - [x] Badge cloud (☁) ou device (📱) sur chaque liste selon remoteId
  - [x] Badges masqués en mode invité (pas de bruit visuel)

## Dev Notes

- **CRITICAL**: Pattern local-first. Le localStorage reste la source de vérité pour la réactivité. Supabase est un backup/sync.
- Les `units` sont stockées en JSONB pour éviter une table relationnelle complexe
- Le champ `is_public` sera utilisé plus tard pour le partage avec les amis (Story 10.3)
- Pas de Supabase Realtime ici — c'est un simple CRUD sync

### References
- listsStore actuel: src/stores/listsStore.ts
- Types: src/types/armyList.types.ts
- Supabase CRUD: https://supabase.com/docs/guides/database

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- Migration SQL complète avec RLS, indexes, trigger updated_at
- listsSyncService avec 6 méthodes CRUD + mapping bidirectionnel + error handling robuste
- listsStore enrichi : sync fire-and-forget sur chaque mutation, syncOnLogin avec merge strategy
- authStore enrichi : lazy import de listsStore.syncOnLogin sur auth state change
- Type ArmyList étendu avec remoteId? et isPublic?
- ListsPage : badges sync (☁/📱) + indicateur "Sync..." dans le header
- 216 tests total, 16 nouveaux (6 SQL + 8 sync service + 2 syncOnLogin), 0 régression
### File List
- supabase/migrations/20260421_create_army_lists.sql (créé)
- supabase/migrations/20260421_create_army_lists.test.ts (créé)
- src/services/listsSyncService.ts (créé)
- src/services/listsSyncService.test.ts (créé)
- src/stores/listsStore.ts (modifié — sync integration)
- src/stores/listsStore.test.ts (modifié — ajout tests sync)
- src/stores/authStore.ts (modifié — syncOnLogin trigger)
- src/types/armyList.types.ts (modifié — ajout remoteId, isPublic)
- src/pages/Lists/ListsPage.tsx (modifié — sync indicators)
