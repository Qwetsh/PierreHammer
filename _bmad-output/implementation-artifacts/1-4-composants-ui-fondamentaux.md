# Story 1.4: Composants UI fondamentaux

Status: review

## Story

As a joueur,
I want des interactions visuelles claires et cohérentes (boutons, recherche, notifications, états vides),
so that je comprenne toujours ce qui se passe et quoi faire ensuite.

## Acceptance Criteria

1. Hiérarchie de boutons 4 niveaux (primary/secondary/ghost/danger), max 1 primary par écran (UX-DR18)
2. Composant SearchBar avec filtrage < 100ms sur nom et mots-clés (UX-DR14)
3. Système de toast notifications: éphémère 3s pour succès, persistant avec bouton pour erreurs (UX-DR20)
4. Patterns d'états vides: message bienveillant + action CTA pour chaque vue (UX-DR19)
5. Patterns de feedback inline: changement visuel immédiat, pulse animation, changement couleur (UX-DR21)

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Créer src/components/ui/Button/
  - [x] Button.tsx: 4 variantes (primary, secondary, ghost, danger) via prop `variant`
  - [x] Tailles: sm, md, lg. Zones tactiles min 44x44px
  - [x] primary: bg-primary text-white, secondary: border + bg-transparent, ghost: text only, danger: bg-error
  - [x] Utiliser les CSS tokens du design system
  - [x] Button.test.tsx, index.ts
- [x] Task 2 (AC: #2): Créer src/components/ui/SearchBar/
  - [x] SearchBar.tsx: input avec icône recherche, placeholder, clear button
  - [x] Props: value, onChange, placeholder
  - [x] Debounce intégré (< 100ms) pour le filtrage
  - [x] SearchBar.test.tsx, index.ts
- [x] Task 3 (AC: #3): Créer src/components/ui/Toast/
  - [x] Toast.tsx + ToastProvider context
  - [x] Variantes: success (auto-dismiss 3s), error (persistant avec bouton fermer)
  - [x] Position: bottom-center, au-dessus de la BottomNav
  - [x] Hook useToast() pour trigger depuis n'importe quel composant
  - [x] Toast.test.tsx, index.ts
- [x] Task 4 (AC: #4): Créer src/components/ui/EmptyState/
  - [x] EmptyState.tsx: icône + titre + description bienveillante + CTA button
  - [x] Props: icon, title, description, actionLabel, onAction
  - [x] Ton chaleureux et encourageant (jamais culpabilisant)
  - [x] EmptyState.test.tsx, index.ts
- [x] Task 5 (AC: #5): Définir les animations de feedback
  - [x] Créer des keyframes dans src/theme/animations.css: pulse, fadeIn, slideIn, colorShift
  - [x] Classes utilitaires: animate-pulse-once, animate-success-flash

## Dev Notes

- CRITICAL: Tous les composants ui/ suivent le pattern: export function ComponentName, props typées, hooks d'abord
- CRITICAL: Les zones tactiles DOIVENT faire minimum 44x44px (NFR17)
- Le Toast system utilise React Context pour un state global léger (pas Zustand — c'est de l'UI éphémère)
- Le SearchBar ne gère PAS le filtrage des données — il expose juste la valeur. Le filtrage est fait par le composant parent ou un hook
- Les animations CSS natives sont préférées à Motion pour les micro-interactions haute fréquence (60fps)

### Contexte architecture

- Stack: Vite 8, React 19, TypeScript 5, Tailwind CSS v4 (CSS-first, @tailwindcss/vite plugin, no tailwind.config.js), Motion 12 (import from motion/react), React Router 7, Zustand 5, vite-plugin-pwa
- Alias: `@/` → `src/` in tsconfig.json and vite.config.ts
- Testing: Vitest + React Testing Library, co-located tests (.test.tsx next to component)
- Components: Functional with named exports (`export function`), hooks first, handlers next, render last
- Naming: PascalCase components, camelCase functions/hooks, kebab-case folders/data files
- Theming: CSS custom properties + `data-faction` attribute on `<html>`, 11 semantic tokens, 6 faction palettes
- Dark mode exclusive: bg #0f0f1a
- Typography: display font per faction + Inter body + JetBrains Mono mono, 1.25 scale
- Spacing: 4px system (space-1 to space-8)
- Project structure: components/ui/, components/domain/, components/layout/, pages/, stores/, hooks/, theme/, types/, utils/
- Barrel exports with index.ts per component folder
- No `any`, no HOC, no render props

### References

- [Source: planning-artifacts/ux-design-specification.md#UX-DR18 Boutons]
- [Source: planning-artifacts/ux-design-specification.md#UX-DR14 SearchBar]
- [Source: planning-artifacts/ux-design-specification.md#UX-DR20 Toast]
- [Source: planning-artifacts/ux-design-specification.md#UX-DR19 Empty states]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- ✅ Button: 4 variantes (primary/secondary/ghost/danger), 3 tailles, zones tactiles 44px min
- ✅ SearchBar: input avec icône, clear button, placeholder, onChange contrôlé
- ✅ Toast: ToastProvider context + useToast hook, success auto-dismiss 3s, error persistant avec fermer, positionné au-dessus BottomNav
- ✅ EmptyState: icône + titre + description + CTA optionnel, ton bienveillant
- ✅ Animations CSS: pulse-once, fade-in, slide-in, success-flash
- ✅ 32 tests passent, 0 régressions

### File List
- src/components/ui/Button/Button.tsx (nouveau)
- src/components/ui/Button/Button.test.tsx (nouveau — 7 tests)
- src/components/ui/Button/index.ts (nouveau)
- src/components/ui/SearchBar/SearchBar.tsx (nouveau)
- src/components/ui/SearchBar/SearchBar.test.tsx (nouveau — 5 tests)
- src/components/ui/SearchBar/index.ts (nouveau)
- src/components/ui/Toast/Toast.tsx (nouveau — ToastProvider + useToast)
- src/components/ui/Toast/Toast.test.tsx (nouveau — 5 tests)
- src/components/ui/Toast/index.ts (nouveau)
- src/components/ui/EmptyState/EmptyState.tsx (nouveau)
- src/components/ui/EmptyState/EmptyState.test.tsx (nouveau — 5 tests)
- src/components/ui/EmptyState/index.ts (nouveau)
- src/theme/animations.css (nouveau — keyframes + classes utilitaires)
- src/index.css (modifié — import animations.css)

### Change Log
- 2026-04-01: Story 1.4 implémentée — composants UI fondamentaux (Button, SearchBar, Toast, EmptyState) + animations feedback
