# Story 7.1: Activation du mode partie et sélection de liste

Status: review

## Story

As a joueur en partie,
I want activer un mode partie en choisissant ma liste active,
so that je ne voie que les unités que j'aligne sur la table.

## Acceptance Criteria

1. Le joueur sélectionne la liste à utiliser parmi ses listes existantes
2. Le mode partie s'affiche en overlay plein écran (UX-DR25)
3. Seules les unités de la liste sélectionnée sont affichées (FR24)
4. Le joueur peut quitter le mode partie à tout moment
5. Si aucune liste, message guide vers la création

## Tasks / Subtasks

- [x] Task 1: Créer src/pages/GameMode/GameModePage.tsx
  - [x] Route: /game-mode/:listId (overlay plein écran)
  - [x] Si liste introuvable: EmptyState + CTA vers /lists
  - [x] Affiche les unités de la liste avec nom + points
- [x] Task 2 (AC: #2): Mode overlay plein écran
  - [x] Fond opaque (bg-bg), fixed inset-0 z-50 — masque la BottomNav
  - [x] Bouton "Quitter" en haut à droite pour revenir
  - [x] Transition enter/exit avec Motion (opacity + scale)
- [x] Task 3 (AC: #1, #3): Afficher les unités de la liste
  - [x] Liste simplifiée des unités: nom + points
  - [x] Tap sur une unité → ouvre UnitSheet en slide-in
- [x] Task 4 (AC: #4): Navigation retour
  - [x] Bouton "Quitter" clairement visible dans le header
  - [x] Navigate(-1) pour revenir à la page précédente
- [x] Task 5: Ajouter un accès au mode partie
  - [x] Bouton "Mode partie" dans ListDetailPage (visible quand la liste a des unités)

## Dev Notes

- Le mode partie est un overlay plein écran qui masque la BottomNav
- Phase 2 ajoutera le swipe horizontal (PartySwiper) et le texte agrandi — ici c'est la version simple
- Le bouton "Quitter" doit être bien visible (ghost button en haut à droite)
- Les données des unités sont lues depuis le listsStore + gameDataStore

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR25 Navigation patterns]
- [Source: planning-artifacts/prd.md#FR24]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- GameModePage: overlay plein écran (fixed inset-0 z-50), masque la BottomNav
- Header sticky avec nom de liste, détachement, points, bouton Quitter
- Tap sur unité → slide-in UnitSheet avec bouton retour
- EmptyState si liste vide ou introuvable
- Bouton "Mode partie" conditionnel dans ListDetailPage
- 8 tests couvrant: liste introuvable, header, unités, points, quitter, liste vide, ouverture fiche
- 124 tests passent au total, type check OK
### File List
- src/pages/GameMode/GameModePage.tsx (créé)
- src/pages/GameMode/GameModePage.test.tsx (créé)
- src/pages/Lists/ListDetailPage.tsx (modifié - bouton mode partie)
- src/App.tsx (modifié - route /game-mode/:listId)
