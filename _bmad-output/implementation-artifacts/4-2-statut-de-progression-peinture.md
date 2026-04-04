# Story 4.2: Statut de progression peinture

Status: review

## Story

As a joueur/peintre,
I want attribuer un statut de peinture à chaque figurine possédée,
so that je suive ma progression dans le hobby.

## Acceptance Criteria

1. Cycle entre 4 statuts: Non montée (○) → Montée (◐) → En cours (◑) → Terminée (●) (FR7, UX-DR8)
2. Changement visuel immédiat (tap-to-cycle)
3. En grille: dot de couleur seul. En fiche: icône + label
4. Fiche affiche le statut de peinture (FR20)
5. Statut persisté dans le collectionStore

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Activer le tap-to-cycle sur PaintStatusBadge
  - [x] Connecter onCycle au collectionStore.updateStatus()
  - [x] Cycle: Unassembled → Assembled → InProgress → Completed → Unassembled
  - [x] Animation de feedback au changement (pulse rapide)
- [x] Task 2 (AC: #3): Intégrer PaintStatusBadge dans UnitCard
  - [x] Mode 'dot': petit cercle coloré en coin de la carte
  - [x] Couleurs: gris (non montée), bleu (montée), orange (en cours), vert (terminée)
  - [x] Visible uniquement si l'unité est possédée
- [x] Task 3 (AC: #4): Intégrer PaintStatusBadge dans UnitSheet
  - [x] Mode 'full': icône + label dans la section header/actions
  - [x] Tap-to-cycle fonctionnel
  - [x] Visible uniquement si l'unité est possédée
- [x] Task 4 (AC: #5): Vérifier la persistance
  - [x] Changer un statut → recharger l'app → statut conservé

## Dev Notes

- Le PaintStatusBadge a été créé dans Story 3.3 avec le prop onCycle optionnel. Ici on le connecte au store.
- Les couleurs des statuts doivent utiliser les tokens CSS du design system (success pour terminé, warning pour en cours, etc.)
- L'animation de feedback utilise les keyframes CSS définies dans Story 1.4 (animate-pulse-once)

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR8 StatusBadge]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- PaintStatusBadge: ajout animation pulse-once au clic via classe CSS + onAnimationEnd
- UnitCard: dot de couleur (2.5x2.5 rounded-full) à côté du compteur ×N, visible si possédé
- UnitSheet + UnitDetailPage: déjà connectés au collectionStore avec paint cycle depuis Story 4.1
- Persistance via zustand persist 'pierrehammer-collection' (vérifié dans 4.1)
### File List
- src/components/domain/PaintStatusBadge/PaintStatusBadge.tsx (modified)
- src/components/domain/UnitCard/UnitCard.tsx (modified)
- src/pages/Catalog/CatalogPage.tsx (modified)
