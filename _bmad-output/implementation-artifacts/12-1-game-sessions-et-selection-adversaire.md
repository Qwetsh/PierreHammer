# Story 12.1: Game sessions et sélection de l'adversaire

Status: review

## Story

As a joueur connecté en partie,
I want sélectionner un ami comme adversaire et lier nos deux listes dans une session de jeu,
so that l'app connaisse les deux armées en présence et puisse proposer des simulations contextuelles.

## Acceptance Criteria

1. Depuis le mode partie, un bouton "Jouer contre..." permet de démarrer une game session
2. Le joueur sélectionne un ami parmi sa liste d'amis (avec leurs listes publiques)
3. Le joueur sélectionne la liste d'armée de l'adversaire parmi ses listes publiques
4. Une game session est créée en base (Supabase) avec les deux listes liées
5. Les deux joueurs voient la session active et les listes de l'autre
6. Le joueur peut quitter la session à tout moment

## Tasks / Subtasks

- [x] Task 1 (AC: #4): Schéma DB game sessions
  - [x] Migration SQL Supabase : table game_sessions avec FK vers profiles et army_lists
  - [x] RLS: les deux joueurs de la session peuvent lire/modifier
  - [x] Index sur player1_id et player2_id
  - [x] Tests: RLS bloque l'accès aux sessions d'autres joueurs

- [x] Task 2 (AC: #1, #2, #3): Flow de création de session
  - [x] Modifier GameModePage : ajouter un bouton "Jouer contre..." en haut
  - [x] Au clic → modal de sélection : choisir un ami, charger ses listes publiques, sélectionner sa liste
  - [x] Créer `src/services/gameSessionService.ts`
  - [x] `createSession(player1Id, player1ListId, player2Id, player2ListId)` → insert dans game_sessions
  - [x] Tests: création de session avec les bonnes données

- [x] Task 3 (AC: #4, #5): GameSessionStore
  - [x] Créer `src/stores/gameSessionStore.ts` (Zustand, PAS persist)
  - [x] State: `activeSession`, `opponentProfile`, `opponentList`, `loading`
  - [x] Actions: `startSession()`, `loadSession()`, `endSession()`, `clearSession()`
  - [x] À la création, charger la liste et le profil de l'adversaire
  - [x] Stocker les datasheets de la faction adverse (via gameDataStore.loadFaction)
  - [x] Tests: session active avec liste adversaire chargée

- [x] Task 4 (AC: #5): Affichage de la session
  - [x] Dans GameModePage, si session active :
    - Header enrichi : "Vous vs {pseudo adversaire}"
    - Onglet supplémentaire "Adversaire" montrant sa liste (lecture seule)
    - Chaque unité adverse affiche son profil complet + bouton Simuler
  - [x] Charger la faction adverse si pas déjà chargée
  - [x] Tests: onglet adversaire affiche les unités correctement

- [x] Task 5 (AC: #6): Fin de session
  - [x] Bouton "Terminer" → met status à 'completed'
  - [x] Au quit, retour au mode partie normal (sans adversaire)
  - [x] Tests: fin de session nettoie le state

## Dev Notes

- La game session est SIMPLE dans cette story — pas de temps réel, pas de tracking de pertes. C'est juste "lier deux listes ensemble".
- Le Realtime Supabase viendra dans la Story 12.2 pour le tracking des pertes
- L'adversaire n'a PAS besoin d'accepter la session — c'est une vue unilatérale. Le joueur "voit" la liste publique de son ami et simule contre elle.
- Si l'adversaire modifie sa liste pendant la partie, ce n'est PAS reflété (snapshot au moment de la création)
- Le bouton "Jouer contre..." n'apparaît que si l'utilisateur est connecté et a des amis

### References
- GameModePage: src/pages/GameMode/GameModePage.tsx
- friendsStore: src/stores/friendsStore.ts (Story 10.3)
- listsSyncService: src/services/listsSyncService.ts (Story 10.2)
- gameDataStore: src/stores/gameDataStore.ts

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- Migration game_sessions avec FK vers profiles et army_lists, RLS pour les deux joueurs, indexes, trigger updated_at
- gameSessionService avec createSession, getActiveSession, endSession — même pattern Supabase que friendsService
- gameSessionStore Zustand : startSession charge profil + liste adversaire + faction, loadSession restore au chargement, endSession nettoie
- GameModePage enrichi : bouton "Jouer contre..." (conditionnel auth + amis + remoteId), modal 2 étapes (ami → liste), onglet "Adversaire" avec unités + profils + bouton Simuler, header "Vous vs {pseudo}", bouton "Terminer"
- 386 tests total, 21 nouveaux, 0 régression
### File List
- supabase/migrations/20260422_create_game_sessions.sql (créé)
- supabase/migrations/20260422_create_game_sessions.test.ts (créé)
- src/services/gameSessionService.ts (créé)
- src/services/gameSessionService.test.ts (créé)
- src/stores/gameSessionStore.ts (créé)
- src/stores/gameSessionStore.test.ts (créé)
- src/pages/GameMode/GameModePage.tsx (modifié — session flow, onglet adversaire, fin de session)
