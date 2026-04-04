# Story 3.2: Grille d'unités avec UnitCard

Status: review

## Story

As a joueur,
I want voir toutes les unités de ma faction sous forme de cartes,
so that je puisse rapidement identifier les unités qui m'intéressent.

## Acceptance Criteria

1. Chaque unité affichée dans un composant UnitCard (nom, points, type)
2. UnitCards ont 3 variantes visuelles: standard, battleline (identifié), epic hero (identifié)
3. Grille responsive (2 colonnes 360px, 3 colonnes 640px, etc.)
4. Tap sur une UnitCard navigue vers la fiche complète (UnitSheet)

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Créer src/components/domain/UnitCard/
  - [x] UnitCard.tsx avec nom, points, badges (Battleline/Epic Hero), owned optionnel
  - [x] 3 variantes visuelles basées sur keywords
  - [x] UnitCard.test.tsx (6 tests), index.ts
- [x] Task 2 (AC: #3): Grille responsive dans CatalogPage
  - [x] Grid CSS: grid-cols-2 par défaut, sm:grid-cols-3, lg:grid-cols-4, xl:grid-cols-6
  - [x] Gap: gap-3 (12px)
- [x] Task 3 (AC: #4): Navigation vers UnitSheet
  - [x] Au tap: navigate(`/catalog/${factionSlug}/${datasheetId}`)
  - [x] Bouton "Changer" pour revenir au FactionPicker

## Dev Notes

- CRITICAL: UnitCard utilise les tokens CSS du design system (--color-primary, --color-card-epic, --color-card-battleline)
- La détection du type d'unité se fait via les keywords: si keywords contient "EPIC HERO" → variante epic, "BATTLELINE" → variante battleline
- Le prop owned est optionnel — sera alimenté par le collectionStore dans Epic 4
- Les images de figurines sont Phase 2 (Epic 8) — pour l'instant, pas d'image, juste nom + points + type

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR6 UnitCard]
- [Source: planning-artifacts/architecture.md#Naming Patterns - Composants]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- ✅ UnitCard: nom, points (1er tier), badges Battleline/Epic Hero, owned optionnel
- ✅ Grille responsive: grid-cols-2, sm:3, lg:4, xl:6 avec gap-3
- ✅ Navigation: tap → /catalog/{slug}/{id}, bouton "Changer" faction
- ✅ 45 tests passent, 0 régressions

### File List
- src/components/domain/UnitCard/UnitCard.tsx (nouveau)
- src/components/domain/UnitCard/UnitCard.test.tsx (nouveau — 6 tests)
- src/components/domain/UnitCard/index.ts (nouveau)
- src/pages/Catalog/CatalogPage.tsx (modifié — grille UnitCard + navigation)

### Change Log
- 2026-04-01: Story 3.2 implémentée — UnitCard avec variantes visuelles, grille responsive, navigation vers fiche
