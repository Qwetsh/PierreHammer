# Story 1.5: Responsive & Accessibilité

Status: review

## Story

As a joueur sur smartphone,
I want une app utilisable sur mon écran (360–428px) avec des zones tactiles confortables,
so that je puisse naviguer sans difficulté, même avec de gros doigts.

## Acceptance Criteria

1. Layout s'adapte sur 4 breakpoints (360px 2 colonnes, 640px 3 colonnes, 768px 3-4 colonnes, 1024-1280px 4-6 colonnes) (UX-DR23)
2. Toutes les zones interactives font minimum 44x44px (NFR17)
3. Contraste WCAG AA (4.5:1 minimum) (UX-DR22)
4. prefers-reduced-motion désactive les animations
5. focus-visible stylé pour navigation clavier
6. Éléments dynamiques utilisent aria-live approprié
7. Skip link présent
8. HTML sémantique
9. Compatible Chrome Mobile 90+ et Safari iOS 15+ (NFR15)

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Configurer les breakpoints responsive
  - [x] Définir les breakpoints dans le CSS: sm (640px), md (768px), lg (1024px), xl (1280px)
  - [x] Créer des classes utilitaires grid pour les colonnes: grid-cols-2 mobile, sm:grid-cols-3, md:grid-cols-3, lg:grid-cols-4, xl:grid-cols-6
  - [x] Tailwind fournit ces breakpoints par défaut — vérifier la compatibilité avec v4
- [x] Task 2 (AC: #2): Audit des zones tactiles
  - [x] Vérifier que Button, BottomNav tabs, SearchBar input ont min 44x44px
  - [x] Ajouter min-h-[44px] min-w-[44px] aux composants interactifs si nécessaire
- [x] Task 3 (AC: #3): Vérifier les contrastes
  - [x] Vérifier que text (#e0e0e0) sur bg (#0f0f1a) = ratio > 4.5:1
  - [x] Vérifier text-muted sur surface, success/warning/error sur bg
  - [x] Ajuster les couleurs si le ratio est insuffisant
- [x] Task 4 (AC: #4): Support prefers-reduced-motion
  - [x] Ajouter @media (prefers-reduced-motion: reduce) dans base.css
  - [x] Désactiver toutes les animations et transitions
  - [x] Les animations Motion doivent respecter ce media query
- [x] Task 5 (AC: #5): Styles focus-visible
  - [x] Ajouter :focus-visible styles dans base.css (outline 2px solid accent, offset 2px)
  - [x] S'assurer que le style n'apparaît QUE pour la navigation clavier (pas au tap)
- [x] Task 6 (AC: #6): aria-live regions
  - [x] Identifier les zones dynamiques futures: PointsCounter, Toast, search results count
  - [x] Préparer une convention d'utilisation de aria-live="polite" et aria-live="assertive"
- [x] Task 7 (AC: #7): Skip link
  - [x] Ajouter un skip link en haut de AppShell: "Aller au contenu principal"
  - [x] Caché visuellement mais accessible au focus clavier
  - [x] Lien vers #main-content sur le content area
- [x] Task 8 (AC: #8): Audit HTML sémantique
  - [x] AppShell: <main>, <nav>, <header> appropriés
  - [x] BottomNav: <nav role="tablist">
  - [x] Pages: sections avec headings appropriés

## Dev Notes

- CRITICAL: Tailwind CSS v4 inclut les breakpoints par défaut (sm, md, lg, xl). Pas besoin de config manuelle.
- Les contrastes doivent être vérifiés pour CHAQUE combinaison de tokens du design system
- Le skip link est un <a> positionné hors écran avec clip, visible uniquement sur :focus
- Pas besoin de tests E2E pour l'accessibilité au MVP — un audit visuel et des tests manuels suffisent

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

- [Source: planning-artifacts/ux-design-specification.md#UX-DR22 Accessibilité]
- [Source: planning-artifacts/ux-design-specification.md#UX-DR23 Responsive]
- [Source: planning-artifacts/architecture.md#Compatibilité NFR15-17]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- ✅ Breakpoints Tailwind v4 par défaut (sm/md/lg/xl) confirmés fonctionnels
- ✅ Zones tactiles 44px min vérifiées sur Button, BottomNav, SearchBar, Toast close
- ✅ Contraste ajusté: --color-text-muted relevé de #8888a0 à #9494b0 pour WCAG AA sur surface
- ✅ prefers-reduced-motion désactive animations/transitions (CSS global)
- ✅ :focus-visible avec outline accent 2px + offset 2px, pas de focus au tap
- ✅ aria-live: Toast a role="alert" (assertive implicite), convention établie pour futurs composants
- ✅ Skip link "Aller au contenu principal" dans AppShell, caché visuellement, visible au focus
- ✅ HTML sémantique: <main id="main-content">, <nav role="tablist">, <h1> par page
- ✅ 36 tests passent, 0 régressions

### File List
- src/theme/base.css (modifié — text-muted ajusté, focus-visible, reduced-motion, skip-link styles)
- src/components/layout/AppShell/AppShell.tsx (modifié — skip link + id main-content)
- src/components/layout/AppShell/AppShell.test.tsx (nouveau — 4 tests)

### Change Log
- 2026-04-01: Story 1.5 implémentée — responsive (Tailwind breakpoints), accessibilité (WCAG AA, focus-visible, reduced-motion, skip link, aria-live, sémantique HTML)
