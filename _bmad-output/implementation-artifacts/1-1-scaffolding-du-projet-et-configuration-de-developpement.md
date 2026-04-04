# Story 1.1: Scaffolding du projet et configuration de développement

Status: review

## Story

As a développeur (Thomas),
I want un projet Vite + React-TS configuré avec toutes les dépendances et conventions,
so that je puisse commencer à développer les fonctionnalités sur une base solide.

## Acceptance Criteria

1. Given un environnement Node.js installé, When Thomas exécute les commandes d'initialisation, Then le projet est créé avec Vite 8, React 19, TypeScript 5
2. Tailwind CSS v4 est configuré avec le plugin @tailwindcss/vite (CSS-first, PAS de tailwind.config.js)
3. Motion (import from "motion/react"), React Router 7, Zustand 5 et vite-plugin-pwa sont installés
4. L'alias @/ → src/ est configuré dans tsconfig.json ET vite.config.ts
5. Vitest + React Testing Library sont configurés avec tests co-localisés
6. `npm run dev` démarre l'app sans erreur

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Créer le projet avec `npm create vite@latest pierrehammer -- --template react-ts`
  - [x] Run `npm install` after scaffold
- [x] Task 2 (AC: #2): Configurer Tailwind CSS v4
  - [x] `npm install -D tailwindcss @tailwindcss/vite`
  - [x] Ajouter `@tailwindcss/vite` plugin dans vite.config.ts
  - [x] Ajouter `@import "tailwindcss"` dans src/index.css
- [x] Task 3 (AC: #3): Installer les dépendances runtime
  - [x] `npm install motion react-router zustand`
  - [x] `npm install -D vite-plugin-pwa`
- [x] Task 4 (AC: #4): Configurer l'alias @/
  - [x] Ajouter `"paths": {"@/*": ["./src/*"]}` dans tsconfig.app.json
  - [x] Ajouter `resolve.alias: { '@': '/src' }` dans vite.config.ts (utiliser path.resolve)
- [x] Task 5 (AC: #5): Configurer Vitest
  - [x] `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
  - [x] Ajouter config vitest dans vite.config.ts (environment: 'jsdom', globals: true)
  - [x] Créer setupTests.ts avec import '@testing-library/jest-dom'
- [x] Task 6 (AC: #6): Créer la structure de dossiers initiale
  - [x] Créer: components/ui/, components/domain/, components/layout/, pages/, stores/, hooks/, theme/, types/, utils/, data/
  - [x] Nettoyer les fichiers template Vite par défaut (App.css, assets/)
- [x] Task 7: Vérifier que `npm run dev` et `npm test` fonctionnent

## Dev Notes

- CRITICAL: Tailwind CSS v4 utilise une config CSS-first. PAS de fichier tailwind.config.js. La config se fait dans le CSS avec @theme.
- CRITICAL: Motion (ex framer-motion) s'importe depuis `motion/react`, PAS depuis `framer-motion`
- CRITICAL: React Router v7 s'utilise en mode SPA (pas framework/Remix mode)
- Le vite.config.ts doit avoir 3 plugins: react(), tailwindcss(), VitePWA() (PWA config de base, affinée dans Epic 6)
- La structure pipeline/ sera créée dans Epic 2, ne pas la créer ici

### Contexte architecture

- Stack: Vite 8, React 19, TypeScript 5, Tailwind CSS v4 (CSS-first, @tailwindcss/vite plugin, no tailwind.config.js), Motion 12 (import from motion/react), React Router 7, Zustand 5, vite-plugin-pwa
- Init command: `npm create vite@latest pierrehammer -- --template react-ts` then install deps
- Alias: `@/` → `src/` in tsconfig.json and vite.config.ts
- Testing: Vitest + React Testing Library, co-located tests (.test.tsx next to component)
- Components: Functional with named exports (`export function`), hooks first, handlers next, render last
- Naming: PascalCase components, camelCase functions/hooks, kebab-case folders/data files
- Stores: Zustand with persist middleware, 3 stores (collectionStore, listsStore, preferencesStore) + gameDataStore
- Theming: CSS custom properties + `data-faction` attribute on `<html>`, 11 semantic tokens, 6 faction palettes
- Dark mode exclusive: bg #0f0f1a
- Typography: display font per faction + Inter body + JetBrains Mono mono, 1.25 scale
- Spacing: 4px system (space-1 to space-8)
- Project structure: components/ui/, components/domain/, components/layout/, pages/, stores/, hooks/, theme/, types/, utils/
- Barrel exports with index.ts per component folder
- No `any`, no HOC, no render props

### Project Structure Notes

- Ce story crée l'arborescence vide. Les fichiers seront peuplés dans les stories suivantes.
- Le dossier src/data/ contiendra les JSON de jeu (créés par le pipeline, Epic 2)

### References

- [Source: planning-artifacts/architecture.md#Starter Template Evaluation]
- [Source: planning-artifacts/architecture.md#Project Structure & Boundaries]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Implementation Plan
- Scaffold Vite + React-TS, déplacer fichiers à la racine
- Installer Tailwind CSS v4 CSS-first avec plugin @tailwindcss/vite
- Installer dépendances runtime (motion, react-router, zustand) + vite-plugin-pwa (--legacy-peer-deps car Vite 8 pas encore dans peerDeps)
- Configurer alias @/ dans tsconfig.app.json et vite.config.ts
- Configurer Vitest avec jsdom, globals, setupTests.ts
- Ajouter VitePWA() plugin (config de base)
- Créer arborescence src/, nettoyer les fichiers template Vite
- Créer App.tsx minimal avec named export, test co-localisé

### Completion Notes List
- ✅ Projet scaffoldé avec Vite 8.0.3, React 19.2.4, TypeScript 5.9.3
- ✅ Tailwind CSS v4.2.2 configuré en CSS-first (pas de tailwind.config.js)
- ✅ Motion 12, React Router 7.13, Zustand 5.0, vite-plugin-pwa 1.2 installés
- ✅ Alias @/ → src/ fonctionnel dans TS et Vite
- ✅ Vitest 4.1 + RTL 16.3 + jest-dom configurés avec test co-localisé passant
- ✅ npm run dev démarre sans erreur, npm test passe (1 test)
- ⚠️ vite-plugin-pwa installé avec --legacy-peer-deps (ne déclare pas Vite 8 dans peerDeps encore)

### File List
- vite.config.ts (nouveau — config Vite avec react, tailwindcss, VitePWA, alias, vitest)
- package.json (nouveau — dépendances et scripts)
- tsconfig.json (nouveau — références TS)
- tsconfig.app.json (modifié — ajout alias @/, types vitest/globals)
- tsconfig.node.json (nouveau — config TS node)
- eslint.config.js (nouveau — config ESLint)
- index.html (nouveau — point d'entrée HTML)
- src/main.tsx (modifié — import named App)
- src/App.tsx (modifié — composant minimal PierreHammer)
- src/App.test.tsx (nouveau — test de base RTL)
- src/index.css (modifié — @import "tailwindcss")
- src/setupTests.ts (nouveau — import jest-dom)
- src/components/ui/.gitkeep
- src/components/domain/.gitkeep
- src/components/layout/.gitkeep
- src/pages/.gitkeep
- src/stores/.gitkeep
- src/hooks/.gitkeep
- src/theme/.gitkeep
- src/types/.gitkeep
- src/utils/.gitkeep
- src/data/.gitkeep
- src/vite-env.d.ts (nouveau — types Vite client)
- public/ (dossier existant)

### Change Log
- 2026-04-01: Story 1.1 implémentée — scaffolding complet du projet avec Vite 8 + React 19 + TS 5, Tailwind v4 CSS-first, Vitest, et structure de dossiers
