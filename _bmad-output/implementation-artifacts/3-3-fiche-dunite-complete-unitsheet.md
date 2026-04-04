# Story 3.3: Fiche d'unité complète (UnitSheet)

Status: review

## Story

As a joueur,
I want consulter toutes les informations d'une unité sur une seule vue scrollable,
so that je n'aie pas besoin de chercher dans des accordéons ou des sous-menus.

## Acceptance Criteria

1. Fiche contient 8 sections ordonnées: header → actions → profil de caractéristiques → armes de tir → armes de mêlée → capacités → mots-clés → options (UX-DR7)
2. Aucun accordéon — tout visible en scrollant (FR19)
3. Navigation vers la fiche en transition slide-in < 200ms (NFR2)
4. Bouton retour ramène à la grille avec restauration de position de scroll
5. StatusBadge affiche le statut de peinture (4 états visuels) (UX-DR8)

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Créer src/components/domain/UnitSheet/
  - [x] UnitSheet.tsx: reçoit un Datasheet complet en props
  - [x] Section 1 - Header: nom, faction, type (EPIC HERO badge si applicable)
  - [x] Section 2 - Actions: bouton "Ajouter à une liste" (préparé, fonctionnel dans Epic 5) + StatusBadge (fonctionnel dans Epic 4)
  - [x] Section 3 - Profil: tableau M/T/SV/W/LD/OC
  - [x] Section 4 - Armes de tir: tableau avec nom, portée, A, BS, F, PA, D
  - [x] Section 5 - Armes de mêlée: tableau avec nom, A, WS, F, PA, D
  - [x] Section 6 - Capacités: liste des abilities avec descriptions
  - [x] Section 7 - Mots-clés: liste des keywords
  - [x] Section 8 - Options: wargear options / composition
  - [x] UnitSheet.test.tsx, index.ts
- [x] Task 2 (AC: #5): Créer src/components/domain/PaintStatusBadge/
  - [x] PaintStatusBadge.tsx: 4 états (○ Non montée, ◐ Montée, ◑ En cours, ● Terminée)
  - [x] Props: status, size ('dot' | 'full'), onCycle?
  - [x] Mode dot: juste le cercle coloré (pour grille)
  - [x] Mode full: icône + label texte (pour fiche)
  - [x] Tap-to-cycle quand onCycle est fourni (fonctionnel dans Epic 4)
  - [x] PaintStatusBadge.test.tsx, index.ts
- [x] Task 3 (AC: #3, #4): Créer src/pages/Catalog/UnitDetailPage.tsx
  - [x] Route: /catalog/:factionId/:unitId
  - [x] Charge les données depuis gameDataStore
  - [x] Rendu du UnitSheet
  - [x] Transition slide-in < 200ms avec Motion
  - [x] Bouton retour: navigate(-1) avec restauration du scroll

## Dev Notes

- CRITICAL: ZERO ACCORDÉON. Chaque section est toujours visible. C'est l'ADN de l'app.
- CRITICAL: Le tableau de profil et les tableaux d'armes doivent être lisibles sur 360px. Utiliser un scroll horizontal sur les tableaux si nécessaire.
- Le bouton "Ajouter à une liste" est rendu mais non fonctionnel jusqu'à Epic 5 (Story 5.3)
- Le PaintStatusBadge est rendu mais le tap-to-cycle n'est fonctionnel qu'après Epic 4 (Story 4.2)
- Pour la restauration du scroll: utiliser React Router's ScrollRestoration ou sauvegarder scrollY avant navigation

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR7 UnitSheet]
- [Source: planning-artifacts/ux-design-specification.md#UX-DR8 StatusBadge]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- UnitSheet: 8 sections (header, actions, profil, armes tir, armes mêlée, capacités, mots-clés, composition/équipement), toutes visibles sans accordéon
- PaintStatusBadge: 4 états avec dot/full modes, tap-to-cycle prêt pour Epic 4
- UnitDetailPage: route avec slide-in Motion 180ms, bouton retour navigate(-1)
- Route App.tsx mise à jour pour utiliser UnitDetailPage au lieu de CatalogPage
- 14 tests UnitSheet + 4 tests PaintStatusBadge = 18 tests, 63 tests total passent
### File List
- src/components/domain/UnitSheet/UnitSheet.tsx
- src/components/domain/UnitSheet/UnitSheet.test.tsx
- src/components/domain/UnitSheet/index.ts
- src/components/domain/PaintStatusBadge/PaintStatusBadge.tsx
- src/components/domain/PaintStatusBadge/PaintStatusBadge.test.tsx
- src/components/domain/PaintStatusBadge/index.ts
- src/pages/Catalog/UnitDetailPage.tsx
- src/App.tsx (modified)
