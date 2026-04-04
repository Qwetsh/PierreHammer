# Story 1.2: Design System — Tokens CSS, typographie, espacement & dark mode

Status: review

## Story

As a joueur,
I want une interface cohérente avec un thème sombre immersif,
so that l'app ait une identité visuelle forte dès le premier contact.

## Acceptance Criteria

1. 11 tokens sémantiques CSS disponibles (--color-bg, --color-surface, --color-primary, --color-accent, --color-text, --color-text-muted, --color-success, --color-warning, --color-error, --color-card-epic, --color-card-battleline)
2. Fond par défaut #0f0f1a (dark mode exclusif, pas de light mode)
3. 6 palettes faction en CSS custom properties avec [data-faction="xxx"] selectors: Space Marines (#1b3a6b/Cinzel), Orks (#2d4a1e/Black Ops One), Aeldari (émeraude/Quicksand), Necrons (vert/Orbitron), Chaos, Tyranides
4. Système typographique: display (variable par faction), body (Inter), mono (JetBrains Mono), échelle 1.25 Major Third
5. Tokens espacement 4px: --space-1(4px), --space-2(8px), --space-3(12px), --space-4(16px), --space-6(24px), --space-8(32px)
6. L'attribut data-faction sur <html> permet de switcher les palettes instantanément

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Créer src/theme/base.css
  - [x] Définir :root avec les 11 tokens sémantiques (valeurs par défaut dark mode)
  - [x] Fond: --color-bg: #0f0f1a
  - [x] Surface: --color-surface: #1a1a2e
  - [x] Définir les tokens espacement (AC: #5)
- [x] Task 2 (AC: #3): Créer src/theme/factions.css
  - [x] [data-faction="space-marines"] { --color-primary: #1b3a6b; --color-accent: #c4a535; --font-display: 'Cinzel', serif; }
  - [x] [data-faction="orks"] { --color-primary: #2d4a1e; --color-accent: #ff6b35; --font-display: 'Black Ops One', sans-serif; }
  - [x] [data-faction="aeldari"], [data-faction="necrons"], [data-faction="chaos"], [data-faction="tyranids"]
- [x] Task 3 (AC: #4): Configurer la typographie
  - [x] Ajouter les imports Google Fonts dans index.html (Inter, JetBrains Mono, + faction display fonts)
  - [x] Définir --font-display, --font-body: 'Inter', --font-mono: 'JetBrains Mono' dans base.css
  - [x] Configurer l'échelle typographique 1.25 (text-sm: 0.8rem, text-base: 1rem, text-lg: 1.25rem, text-xl: 1.563rem, text-2xl: 1.953rem, text-3xl: 2.441rem)
- [x] Task 4 (AC: #6): Créer src/hooks/useFactionTheme.ts
  - [x] Hook qui set document.documentElement.dataset.faction = factionId
  - [x] Cleanup quand la faction change
- [x] Task 5: Importer base.css et factions.css dans src/index.css
- [x] Task 6: Créer un test vérifiant que changer data-faction switche les CSS vars

## Dev Notes

- CRITICAL: Tailwind CSS v4 utilise @theme dans le CSS pour étendre les tokens, pas tailwind.config.js. Utiliser @theme { --color-primary: var(--color-primary); } pour exposer les CSS vars à Tailwind
- Les polices de faction display sont chargées via Google Fonts link dans index.html. Cinzel, Black Ops One, Quicksand, Orbitron sont toutes sur Google Fonts
- Le hook useFactionTheme sera utilisé par tous les composants qui affichent du contenu lié à une faction
- Fichiers à créer: src/theme/base.css, src/theme/factions.css, src/hooks/useFactionTheme.ts

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

- [Source: planning-artifacts/architecture.md#Frontend Architecture - Theming]
- [Source: planning-artifacts/ux-design-specification.md#Fondation design system]
- [Source: planning-artifacts/architecture.md#Naming Patterns]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- ✅ 11 tokens sémantiques CSS définis dans base.css (--color-bg, surface, primary, accent, text, text-muted, success, warning, error, card-epic, card-battleline)
- ✅ Fond dark mode exclusif #0f0f1a
- ✅ 6 palettes faction avec [data-faction] selectors (space-marines, orks, aeldari, necrons, chaos, tyranids)
- ✅ Typographie: Inter (body), JetBrains Mono (mono), fonts display par faction via Google Fonts
- ✅ Échelle typographique 1.25 Major Third
- ✅ Espacement 4px (space-1 à space-8)
- ✅ Hook useFactionTheme avec cleanup
- ✅ Tokens exposés à Tailwind via @theme
- ✅ 5 tests passent (4 hook + 1 App)

### File List
- src/theme/base.css (nouveau — tokens sémantiques, typo, espacement)
- src/theme/factions.css (nouveau — 6 palettes faction)
- src/hooks/useFactionTheme.ts (nouveau — hook data-faction)
- src/hooks/useFactionTheme.test.ts (nouveau — 4 tests hook)
- src/index.css (modifié — imports theme + @theme Tailwind + body styles)
- index.html (modifié — Google Fonts imports, titre PierreHammer)

### Change Log
- 2026-04-01: Story 1.2 implémentée — design system complet avec tokens, typographie, espacement, palettes faction et hook de thème
