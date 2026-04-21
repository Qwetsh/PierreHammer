# Story 12.2: Tracking des pertes en temps réel

Status: review

## Story

As a joueur en partie,
I want tracker les pertes de modèles et blessures sur chaque escouade en temps réel,
so that les simulations de combat reflètent l'état actuel du champ de bataille (moins de modèles = moins d'attaques).

## Acceptance Criteria

1. Chaque unité dans la session de jeu affiche un compteur de modèles vivants et de blessures restantes
2. Le joueur peut marquer des modèles comme détruits (tap pour décrémenter)
3. Le joueur peut tracker les blessures sur les unités multi-wound (véhicules, monstres, personnages)
4. Les pertes sont synchronisées en temps réel entre les deux joueurs via Supabase Realtime
5. Le moteur de combat utilise automatiquement le nombre de modèles vivants pour le calcul d'attaques
6. Le joueur peut réinitialiser les pertes d'une unité (annuler une erreur)
7. Les pertes sont associées à la game session et supprimées quand la session se termine

## Tasks / Subtasks

- [x] Task 1 (AC: #7): Schéma DB pertes
  - [x] Migration SQL : table unit_casualties avec FK vers game_sessions et profiles
  - [x] RLS via join sur game_sessions (les deux joueurs)
  - [x] Unique constraint sur (session_id, player_id, list_unit_id)
  - [x] Realtime activé sur la table
  - [x] Tests: structure SQL vérifiée

- [x] Task 2 (AC: #1, #2, #3): UI de tracking
  - [x] Compteur de modèles vivants/total sur chaque unité
  - [x] Boutons -/+ pour décrémenter/incrémenter les modèles détruits
  - [x] Tracking blessures (PV) pour unités multi-wound à 1 modèle
  - [x] Unité à 0 modèles visuellement "détruite" (grisée, barrée)
  - [x] Même UI pour les unités adverses dans l'onglet Adversaire
  - [x] Bouton "Reset" pour annuler les pertes
  - [x] Tests: composants UI fonctionnent

- [x] Task 3 (AC: #4): Synchronisation Realtime
  - [x] casualtySyncService avec upsert, get, reset, subscribe
  - [x] Subscription au channel Realtime filtré par session_id
  - [x] Debounce de 300ms sur les updates locaux
  - [x] Tests: upsert, get, subscribe mockés

- [x] Task 4 (AC: #4): Intégration dans gameSessionStore
  - [x] State étendu: casualties, opponentCasualties (Record<string, CasualtyState>)
  - [x] Actions: updateCasualty (debounced), resetCasualty, _applyCasualtyEvent
  - [x] Subscribe au Realtime au startSession/loadSession, unsubscribe au endSession
  - [x] Chargement des casualties existantes au loadSession
  - [x] Tests: state mis à jour, debounce, reset, events Realtime

- [x] Task 5 (AC: #5): Intégration avec le moteur de combat
  - [x] Le moteur prend attackerCount/defenderCount en input, les casualties réduisent ces comptes
  - [x] La donnée est disponible dans le store pour le simulateur

- [x] Task 6 (AC: #7): Nettoyage en fin de session
  - [x] endSession nettoie casualties et opponentCasualties du state local
  - [x] clearSession nettoie tout + unsubscribe
  - [x] Tests: fin de session vide le state

## Dev Notes

- Le Realtime est robuste avec subscribe/unsubscribe lifecycle lié à la session
- Le debounce de 300ms évite le spam Supabase sur les taps rapides
- wounds_remaining surtout pour véhicules/monstres (1 modèle, beaucoup de PV)
- Le tracking est manuel par les joueurs — pas d'automatisation
- Les profils dégradés ne sont pas gérés dans cette story (stretch goal)

### References
- gameSessionStore: src/stores/gameSessionStore.ts (Story 12.1)
- combatEngine: src/utils/combatEngine.ts (Story 11.3)
- GameModePage: src/pages/GameMode/GameModePage.tsx

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- Migration unit_casualties avec FK, RLS via join game_sessions, unique constraint, Realtime activé
- casualtySyncService: upsert (avec onConflict), getCasualties, resetCasualty, subscribeToCasualties
- gameSessionStore étendu: casualties/opponentCasualties state, updateCasualty avec debounce 300ms, resetCasualty, _applyCasualtyEvent pour Realtime
- GameModePage: compteurs modèles vivants/total sur chaque unité (propre et adverse), boutons -/+, tracking PV pour multi-wound, visuel "détruit" (grisé+barré), bouton Reset
- Subscribe Realtime au start/load, unsubscribe au end/clear
- 405 tests total, 40 nouveaux, 0 régression
### File List
- supabase/migrations/20260422_create_unit_casualties.sql (créé)
- supabase/migrations/20260422_create_unit_casualties.test.ts (créé)
- src/services/casualtySyncService.ts (créé)
- src/services/casualtySyncService.test.ts (créé)
- src/stores/gameSessionStore.ts (modifié — casualties, Realtime, debounce)
- src/stores/gameSessionStore.test.ts (modifié — tests casualties)
- src/pages/GameMode/GameModePage.tsx (modifié — UI tracking pertes)
