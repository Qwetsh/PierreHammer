# Story 7.2: Consultation des fiches en mode partie

Status: review

## Story

As a joueur en partie,
I want consulter les fiches de mes unités rapidement pendant le jeu,
so that je vérifie mes stats sans perdre de temps.

## Acceptance Criteria

1. La fiche UnitSheet s'affiche avec toutes les informations
2. Navigation retour ramène à la liste du mode partie (pas à la nav principale)
3. Transitions fluides < 200ms (NFR2)
4. Header du mode partie reste visible pour rappeler la liste active

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Ouvrir UnitSheet depuis le mode partie
  - [x] Réutilise le composant UnitSheet existant
  - [x] Charge les données depuis gameDataStore (faction → datasheets)
- [x] Task 2 (AC: #2): Navigation contextuelle
  - [x] Bouton retour ramène à la liste du mode partie via state local (selectedUnit)
  - [x] Pas de navigation vers la nav principale — tout reste dans l'overlay
- [x] Task 3 (AC: #3): Transitions fluides
  - [x] Transition slide-in 200ms avec Motion (x: 100% → 0)
- [x] Task 4 (AC: #4): Header contextuel
  - [x] Header sticky en mode fiche: bouton retour + nom de l'unité
  - [x] Header sticky en mode liste: nom de liste + détachement + points + bouton quitter

## Dev Notes

- Le UnitSheet est le même composant que celui utilisé dans le catalogue — juste le contexte de navigation change
- La navigation contextuelle peut être gérée via un query param: ?from=game-mode ou via React Router state
- Le header de mode partie est un composant léger, pas l'ArmyListHeader complet

### References
- [Source: planning-artifacts/prd.md#FR24]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- Toute la fonctionnalité a été implémentée dans la Story 7.1 (GameModePage)
- UnitSheet réutilisé, navigation contextuelle via state local, transitions Motion, header contextuel
- Tests couverts dans GameModePage.test.tsx (test "opens unit sheet when clicking a unit")
### File List
- src/pages/GameMode/GameModePage.tsx (implémenté dans Story 7.1)
