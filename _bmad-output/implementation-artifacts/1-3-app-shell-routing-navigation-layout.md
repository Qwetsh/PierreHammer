# Story 1.3: App Shell — Routing, Navigation & Layout

Status: review

## Story

As a joueur,
I want naviguer entre les 4 sections principales via une barre en bas de l'écran,
so that j'accède rapidement à toutes les fonctionnalités en maximum 2 taps.

## Acceptance Criteria

1. Le joueur voit le contenu directement sans onboarding ni création de compte (FR37)
2. Une BottomNav avec 4 onglets (Collection, Mes Listes, Catalogue, Profil) est affichée en bas (FR35)
3. La BottomNav fait 56px + safe area, avec role="tablist" et états actif/inactif (UX-DR5)
4. Chaque onglet charge sa route via React Router v7 en mode SPA
5. Le code splitting (React.lazy + Suspense) charge chaque route à la demande
6. Toute information accessible en max 2 niveaux de navigation (FR36)
7. Les transitions entre routes utilisent un pattern push slide-in

## Tasks / Subtasks

- [x] Task 1 (AC: #4): Configurer React Router v7 en mode SPA
  - [x] Créer src/App.tsx avec BrowserRouter, Routes, et 4 routes principales
  - [x] Routes: /collection, /lists, /catalog, /profile (default: /collection)
  - [x] Sous-routes: /catalog/:factionId, /catalog/:factionId/:unitId, /lists/:listId
- [x] Task 2 (AC: #5): Implémenter le code splitting
  - [x] React.lazy() pour chaque page component
  - [x] Suspense wrapper avec fallback minimal (skeleton ou spinner)
- [x] Task 3 (AC: #2, #3): Créer src/components/ui/BottomNav/
  - [x] BottomNav.tsx: 4 tabs avec icônes et labels
  - [x] Height: 56px + env(safe-area-inset-bottom)
  - [x] role="tablist" sur le nav, role="tab" sur chaque onglet
  - [x] État actif (couleur primary) / inactif (couleur text-muted)
  - [x] Utiliser NavLink de React Router pour l'état actif
  - [x] BottomNav.test.tsx
  - [x] index.ts
- [x] Task 4 (AC: #1, #6): Créer src/components/layout/AppShell/
  - [x] AppShell.tsx: Layout principal (content area + BottomNav)
  - [x] Content area avec padding-bottom: 56px + safe area
  - [x] Pas d'onboarding, pas de modal au premier lancement
- [x] Task 5 (AC: #7): Ajouter transitions entre routes
  - [x] Utiliser Motion (AnimatePresence) pour les transitions page
  - [x] Pattern slide-in depuis la droite (enter), slide-out vers la gauche (exit)
- [x] Task 6: Créer les pages placeholder
  - [x] CollectionPage, ListsPage, CatalogPage, ProfilePage — contenu minimal "Page X"
  - [x] Chaque page dans son dossier: pages/Collection/, pages/Lists/, pages/Catalog/, pages/Profile/

## Dev Notes

- CRITICAL: React Router v7 en mode SPA, PAS en mode framework. Utiliser `createBrowserRouter` ou `BrowserRouter` + `Routes`
- CRITICAL: Le BottomNav doit rester fixe en bas avec position: fixed et z-index élevé
- Les icônes des onglets peuvent être de simples SVG inline ou un petit set d'icônes (pas de lib lourde comme react-icons)
- src/components/layout/AppShell/ contient le layout racine utilisé par toutes les pages
- src/components/layout/ErrorBoundary/ sera ajouté plus tard

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

### Project Structure Notes

- Fichiers: src/App.tsx, src/components/ui/BottomNav/, src/components/layout/AppShell/, src/pages/Collection/, src/pages/Lists/, src/pages/Catalog/, src/pages/Profile/

### References

- [Source: planning-artifacts/architecture.md#Frontend Architecture - Routing]
- [Source: planning-artifacts/ux-design-specification.md#UX-DR5 BottomNav]
- [Source: planning-artifacts/architecture.md#Project Structure]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- ✅ React Router v7 en mode SPA avec BrowserRouter + Routes
- ✅ 4 routes principales + sous-routes (catalog/:factionId/:unitId, lists/:listId)
- ✅ Code splitting avec React.lazy + Suspense + fallback "Chargement..."
- ✅ BottomNav fixe 56px + safe-area, role="tablist", NavLink avec états actif/inactif
- ✅ AppShell layout avec padding-bottom safe-area
- ✅ Transitions AnimatePresence slide-in/slide-out entre routes
- ✅ 4 pages placeholder (Collection, Lists, Catalog, Profile)
- ✅ Pas d'onboarding, accès direct au contenu
- ✅ 10 tests passent (4 BottomNav, 4 useFactionTheme, 2 App)

### File List
- src/App.tsx (modifié — routing, lazy loading, transitions, AppShell)
- src/App.test.tsx (modifié — tests navigation)
- src/components/ui/BottomNav/BottomNav.tsx (nouveau)
- src/components/ui/BottomNav/BottomNav.test.tsx (nouveau — 4 tests)
- src/components/ui/BottomNav/index.ts (nouveau)
- src/components/layout/AppShell/AppShell.tsx (nouveau)
- src/components/layout/AppShell/index.ts (nouveau)
- src/pages/Collection/CollectionPage.tsx (nouveau)
- src/pages/Lists/ListsPage.tsx (nouveau)
- src/pages/Catalog/CatalogPage.tsx (nouveau)
- src/pages/Profile/ProfilePage.tsx (nouveau)

### Change Log
- 2026-04-01: Story 1.3 implémentée — App Shell avec routing SPA, BottomNav accessible, code splitting et transitions animées
