# Story 9.1: Navigation swipe et texte agrandi en mode partie (PartySwiper)

Status: review

## Story

As a joueur en partie,
I want swiper horizontalement entre les fiches de ma liste et les lire en gros texte,
so that je consulte rapidement mes unités à distance de bras sans plisser les yeux.

## Acceptance Criteria

1. Navigation par swipe horizontal gauche/droite entre les fiches de la liste active (FR25, UX-DR17)
2. Un indicateur de position montre quelle unité est affichée (ex: 3/8)
3. Des boutons flèches sont disponibles en alternative au swipe
4. Le texte est affiché en taille agrandie (20-28px) pour être lisible à distance de bras (FR26)
5. Les transitions entre fiches sont fluides

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #5): Composant PartySwiper
  - [x] src/features/game-mode/components/PartySwiper.tsx
  - [x] Swipe horizontal via motion/react drag gesture + onDragEnd avec threshold 50px
  - [x] AnimatePresence mode="wait" pour transitions slide 250ms
  - [x] Prop initialIndex pour démarrer à une unité spécifique
- [x] Task 2 (AC: #2): Indicateur de position
  - [x] "X / N" en header avec aria-live="polite"
  - [x] Mis à jour à chaque changement de fiche
- [x] Task 3 (AC: #3): Boutons de navigation alternatifs
  - [x] Boutons flèches semi-transparents sur les côtés
  - [x] Masqués en première/dernière position
  - [x] Même animation que le swipe
- [x] Task 4 (AC: #4): Mode texte agrandi
  - [x] Classe CSS .party-mode-text appliquée au conteneur swipeable
  - [x] h1: 1.75rem, h2: 1.5rem, body: 1.25rem, tables: 1.1rem
  - [x] Scroll vertical par fiche
- [x] Task 5: Intégration avec le mode partie existant
  - [x] GameModePage utilise PartySwiper au lieu du slide-in simple
  - [x] Tap sur unité → ouvre PartySwiper à l'index correspondant
  - [x] Liste vide: EmptyState

## Dev Notes

- **CRITICAL**: Importer depuis `motion/react`, PAS `framer-motion`
- Le swipe doit bien fonctionner sur mobile tactile — tester les touch events
- Utiliser `useMotionValue` pour tracker la position du drag et animer la transition
- Le composant doit être accessible : les boutons flèches sont l'alternative au swipe
- `prefers-reduced-motion` : transitions instantanées (pas de slide) si activé
- La taille de texte agrandie ne doit pas casser le layout — tester avec des noms d'unités longs
- Composants : `export function`, named exports, hooks en premier

### References
- [Source: planning-artifacts/ux-design-specification.md#Mode partie - PartySwiper]
- [Source: planning-artifacts/prd.md#FR25, FR26]
- [Source: planning-artifacts/architecture.md#Features game-mode]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- PartySwiper avec drag gesture, AnimatePresence, indicateur de position, boutons flèches
- CSS .party-mode-text pour texte agrandi en mode partie
- GameModePage réécrit pour utiliser PartySwiper au lieu du slide-in simple
- 8 tests PartySwiper: position, quit, arrows, navigation, initialIndex
- 141 tests passent au total, type check OK
### File List
- src/features/game-mode/components/PartySwiper.tsx (créé)
- src/features/game-mode/components/PartySwiper.test.tsx (créé)
- src/pages/GameMode/GameModePage.tsx (réécrit - intégration PartySwiper)
- src/theme/animations.css (modifié - .party-mode-text)
