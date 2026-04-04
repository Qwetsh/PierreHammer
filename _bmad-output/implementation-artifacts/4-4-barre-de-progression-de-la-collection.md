# Story 4.4: Barre de progression de la collection

Status: review

## Story

As a joueur,
I want voir une barre de progression de ma collection,
so that je mesure visuellement où j'en suis dans mon hobby.

## Acceptance Criteria

1. ProgressBar affiche le pourcentage global de progression (FR9)
2. Variante segmentée montre la répartition par statut (4 couleurs distinctes) (UX-DR15)
3. Se met à jour en temps réel quand un statut change
4. Si collection vide, état vide bienveillant avec CTA "Ajouter ma première figurine"

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Créer src/components/ui/ProgressBar/
  - [x] ProgressBar.tsx: Props { value: number, variant: 'simple' | 'segmented', segments?: Segment[] }
  - [x] Segment: { value: number, color: string, label: string }
  - [x] Simple: une seule barre (percentage total complété)
  - [x] Segmented: 4 segments colorés (non montée/gris, montée/bleu, en cours/orange, terminée/vert)
  - [x] ProgressBar.test.tsx, index.ts
- [x] Task 2 (AC: #1, #3): Ajouter un sélecteur dans collectionStore
  - [x] getProgressStats(): { total, unassembled, assembled, inProgress, completed, percentComplete }
  - [x] Calculé à partir de tous les items de la collection
- [x] Task 3 (AC: #1, #2): Intégrer ProgressBar dans CollectionPage
  - [x] Afficher la ProgressBar segmentée en haut de la page (sous le toggle)
  - [x] Légende: afficher les counts par statut
- [x] Task 4 (AC: #4): Gérer la collection vide
  - [x] Si 0 items: EmptyState "Ajouter ma première figurine" → naviguer vers Catalogue

## Dev Notes

- La barre segmentée utilise des divs avec width en % et background-color correspondant à chaque statut
- Le calcul de progression: percentComplete = (completed / total) * 100 pour la barre simple
- La barre segmentée montre la distribution de TOUS les statuts, pas juste le % complété
- Se met à jour en temps réel car les composants lisent directement depuis le collectionStore (Zustand)

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR15 ProgressBar]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- ProgressBar: simple (single color) + segmented (multi-color with legend), role="progressbar", aria attributes
- getProgressStats() ajouté au collectionStore: counts par statut + percentComplete
- CollectionPage: barre segmentée visible en mode 'owned' quand collection non vide
- Collection vide gérée par EmptyState dans Story 4.3 (déjà implémenté)
### File List
- src/components/ui/ProgressBar/ProgressBar.tsx (new)
- src/components/ui/ProgressBar/ProgressBar.test.tsx (new)
- src/components/ui/ProgressBar/index.ts (new)
- src/stores/collectionStore.ts (modified)
- src/pages/Collection/CollectionPage.tsx (modified)
