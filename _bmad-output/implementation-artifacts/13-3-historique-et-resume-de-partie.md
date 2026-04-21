# Story 13.3: Historique et résumé de partie

Status: review

## Story

As a joueur après une partie,
I want voir un résumé de la partie avec les stats clés,
so that je puisse analyser mes performances et m'améliorer.

## Acceptance Criteria

1. Quand une game session est terminée, un résumé est généré
2. Le résumé contient : durée de la partie, nombre d'unités détruites (par joueur), total de dégâts infligés (si simulations utilisées)
3. Le résumé est consultable après la partie depuis l'historique
4. Un historique des parties passées est accessible depuis le profil
5. Les résumés sont stockés en base (Supabase) et persistants

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Génération du résumé
  - [x] Créer `src/services/gameSummaryService.ts`
  - [x] `computeSummaryStats`: durée, unités/modèles détruits par joueur
  - [x] `createSummary`: insert en base, `getSummariesForUser`: query historique
  - [x] Tests: 7 tests (computeSummaryStats, createSummary, getSummariesForUser)

- [x] Task 2 (AC: #3, #5): Stockage en base
  - [x] Migration SQL: game_summaries avec FK session_id, player1/2_id, factions, detachments, stats
  - [x] RLS: les deux joueurs peuvent lire et insérer leurs résumés
  - [x] Insert automatique dans gameSessionStore.endSession()
  - [x] Tests: 8 tests migration SQL

- [x] Task 3 (AC: #4): Page historique
  - [x] `src/pages/Profile/GameHistoryPage.tsx` créé
  - [x] Route `/profile/history` ajoutée dans App.tsx
  - [x] Lien "Historique des parties" depuis ProfilePage (visible si authentifié)
  - [x] Liste des parties: date, factions, durée, unités détruites
  - [x] Clic sur une partie → détail avec StatCards
  - [x] Limit 50 résultats
  - [x] Tests: 4 tests (login required, empty state, summaries list, loading)

- [x] Task 4: État vide et edge cases
  - [x] Aucune partie → EmptyState "Aucune partie" avec lien vers listes
  - [x] Session abandonnée → résumé partiel (même logique, pertes jusqu'à l'abandon)
  - [x] Pas de connexion → message "Connexion requise"
  - [x] Tests: couverts dans GameHistoryPage.test.tsx

## Dev Notes

- Le résumé est volontairement simple dans cette première version — pas de graphiques ni d'analytics avancés
- Les "simulations utilisées" ne sont PAS trackées côté serveur dans cette story (trop de complexité). Le MVP se base uniquement sur les casualties.
- L'historique n'est disponible que pour les utilisateurs connectés (les parties en mode invité/solo ne génèrent pas de résumé)
- On pourrait ajouter plus tard : win rate par faction, matchup stats, etc. — mais c'est hors scope

### References
- gameSessionService: src/services/gameSessionService.ts (Story 12.1)
- casualtySyncService: src/services/casualtySyncService.ts (Story 12.2)
- ProfilePage: src/pages/Profile/ProfilePage.tsx

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- gameSummaryService: computeSummaryStats (durée + casualties), createSummary, getSummariesForUser
- Migration SQL game_summaries avec RLS read+insert pour les deux joueurs
- gameSessionStore.endSession étendu: crée un résumé fire-and-forget avec factions/detachments
- GameHistoryPage: liste des parties, détail avec StatCards, états vides, login required
- Route /profile/history ajoutée, lien depuis ProfilePage
- ProfilePage wrappé dans MemoryRouter dans les tests (fix useNavigate)
- 467 tests total, 19 nouveaux, 0 régression
### File List
- src/services/gameSummaryService.ts (créé)
- src/services/gameSummaryService.test.ts (créé)
- supabase/migrations/20260422_create_game_summaries.sql (créé)
- supabase/migrations/20260422_create_game_summaries.test.ts (créé)
- src/pages/Profile/GameHistoryPage.tsx (créé)
- src/pages/Profile/GameHistoryPage.test.tsx (créé)
- src/pages/Profile/ProfilePage.tsx (modifié — lien historique, useNavigate)
- src/pages/Profile/ProfilePage.test.tsx (modifié — MemoryRouter wrapper)
- src/stores/gameSessionStore.ts (modifié — summary creation dans endSession)
- src/App.tsx (modifié — route /profile/history)
