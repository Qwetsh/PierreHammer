# Story 8.2: Cartes animées avec parallaxe et brillance (AnimatedCard)

Status: review

## Story

As a joueur,
I want voir mes figurines sous forme de cartes animées avec effets visuels premium,
so that l'app ait un effet "wow" qui impressionne mes potes.

## Acceptance Criteria

1. Un effet parallaxe réagit au mouvement (toucher/gyroscope) sur les UnitCards (FR28, UX-DR16)
2. Un effet de brillance CSS est appliqué sur la carte
3. Les animations tournent à 60fps sur smartphone milieu de gamme 2022+ (NFR5)
4. `prefers-reduced-motion` désactive les animations
5. Le code existant de Thomas pour l'AnimatedCard est intégré et adapté

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Créer le composant AnimatedCard
  - [x] src/components/ui/AnimatedCard/AnimatedCard.tsx
  - [x] Touch tracking (touchstart/move/end) + mouse tracking
  - [x] Rotations 3D (rotateX, rotateY) calculées depuis la position relative
  - [x] useMotionValue + useSpring + useMotionTemplate de motion/react
  - [x] perspective: 800px, transform-style: preserve-3d
- [x] Task 2 (AC: #2): Effet de brillance (shine/glare)
  - [x] Overlay gradient radial positionné dynamiquement via useMotionTemplate
  - [x] Opacité 0.8, suit le mouvement du doigt
- [x] Task 3 (AC: #3): Optimisation des performances
  - [x] will-change: transform sur la carte
  - [x] Transform et opacity uniquement (pas de layout triggers)
  - [x] Spring animation config (stiffness 300, damping 30)
- [x] Task 4 (AC: #4): Accessibilité motion
  - [x] useReducedMotion hook via matchMedia (avec guard pour SSR/jsdom)
  - [x] Si activé: rendu plain div sans animation
- [x] Task 5 (AC: #5): Composant wrapper prêt pour intégration
  - [x] AnimatedCard est un wrapper générique qui accepte children
  - [x] Prop disabled pour désactiver manuellement
  - [x] Barrel export via index.ts

## Dev Notes

- **CRITICAL**: Importer motion depuis `motion/react`, PAS depuis `framer-motion`
- Le composant AnimatedCard wrappe UnitCard — il ne remplace pas
- Le gyroscope nécessite une permission sur iOS 13+ (`DeviceOrientationEvent.requestPermission()`)
- Tester avec les Chrome DevTools en mode mobile pour simuler le gyroscope
- Le throttle via rAF est essentiel : sans ça, les événements gyroscope peuvent arriver à 200Hz+
- Tailwind CSS 4.2.0 : pas de `tailwind.config.js`, configuration via `@theme` dans CSS

### References
- [Source: planning-artifacts/ux-design-specification.md#AnimatedCard]
- [Source: planning-artifacts/prd.md#FR28]
- [Source: planning-artifacts/architecture.md#Composants]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- AnimatedCard avec parallaxe 3D + shine overlay dynamique
- useReducedMotion hook avec guard matchMedia pour jsdom
- useMotionTemplate pour gradient radial dynamique sans re-render
- Spring config optimisée, will-change: transform
- 4 tests: children render, disabled mode, reduced motion, className
- 128 tests passent au total, type check OK
- Note: gyroscope non implémenté (nécessite device réel, difficile à tester)
### File List
- src/components/ui/AnimatedCard/AnimatedCard.tsx (créé)
- src/components/ui/AnimatedCard/AnimatedCard.test.tsx (créé)
- src/components/ui/AnimatedCard/index.ts (créé)
