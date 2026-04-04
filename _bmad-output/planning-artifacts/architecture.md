---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-03-31'
inputDocuments:
  - "planning-artifacts/product-brief-PierreHammer-distillate.md"
  - "planning-artifacts/prd.md"
  - "planning-artifacts/ux-design-specification.md"
  - "planning-artifacts/research/domain-warhammer40k-app-research-2026-03-31.md"
workflowType: 'architecture'
project_name: 'Pierrammer'
user_name: 'Thomas'
date: '2026-03-31'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

38 FRs couvrant 8 domaines fonctionnels. L'architecture doit supporter :
- Un **pipeline de transformation de données** (CSV → JSON) exécuté côté build, pas au runtime
- Un **modèle de données relationnel** liant factions, datasheets, abilities, keywords, points et wargear
- Un **état utilisateur local** (collection avec quantités et statuts, listes d'armée multiples)
- Une **couche de présentation riche** : fiches fusionnées, cartes animées, thèmes dynamiques, mode partie swipe
- Un **moteur de calcul** : points temps réel, validation de composition (Phase 2)

**Non-Functional Requirements:**

| Catégorie | Exigences clés | Impact architectural |
|---|---|---|
| Performance | Chargement < 3s, navigation < 200ms, calcul points < 50ms, animations 60fps, bundle < 2Mo | Code splitting, lazy loading, optimisation JSON, CSS animations vs JS |
| Offline | 100% features offline, service workers cache-first | Strategy de cache versionnée, app shell, pré-cache données de jeu |
| Fiabilité | localStorage jamais corrompu, import validé, SW sert la bonne version | Schéma de données versionné, validation JSON, cache busting |
| Maintenabilité | Pipeline < 2 min, mise à jour < 15 min, extensible V1.5/V2 | Architecture modulaire, séparation données jeu / utilisateur, pipeline idempotent |
| Compatibilité | Chrome/Safari mobile, 360-428px, touch 44x44px | Mobile-first responsive, tactile-native |

**Scale & Complexity:**

- Domaine primaire : Frontend SPA / PWA
- Niveau de complexité : Basse
- Composants architecturaux estimés : ~15-20 (pages, composants métier, services, pipeline)

### Technical Constraints & Dependencies

- **Wahapedia CSV** — Source unique de données de jeu, schéma non garanti, peut disparaître. Architecture doit isoler cette dépendance.
- **localStorage** — Limité à ~5-10 Mo selon navigateurs. Pour 6 joueurs avec ~200 unités max, largement suffisant.
- **Pas de backend** — Toute logique côté client. Pas de synchronisation, pas d'API.
- **Thomas seul développeur** — Codebase doit rester simple et maintenable par une seule personne.
- **Budget horaire limité** — Dizaines d'heures. Favoriser les patterns simples et les librairies matures.
- **Images Wahapedia** — Hébergées sur wahapedia.ru, pas locales. Risque de disponibilité.

### Cross-Cutting Concerns Identified

- **Théming multi-faction** — Impacte tous les composants visuels. Les CSS custom properties doivent être consommées uniformément.
- **Offline/Cache** — Impacte le chargement de données, les images, le service worker. Stratégie cohérente nécessaire.
- **Persistance localStorage** — Impacte collection, listes, préférences. Schéma unifié avec versioning.
- **Phase 1 → Phase 2** — Les hooks pour le wow visuel (cartes animées, mode partie swipe, thèmes) doivent exister dès Phase 1 sans implémentation complète.
- **Transition 11ème édition** — Le modèle de données doit supporter multi-détachements par armée sans migration destructive.

## Starter Template Evaluation

### Primary Technology Domain

Frontend SPA / PWA — React + TypeScript + Tailwind CSS, basé sur les choix du PRD et du brief.

### Versions actuelles vérifiées (mars 2026)

| Technologie | Version | Notes |
|---|---|---|
| Vite | **8.0.3** | Rolldown intégré, builds 10-30x plus rapides |
| React | **19.2.4** | Activity component, stable depuis jan 2026 |
| TypeScript | **5.x** | Inclus avec template `react-ts` |
| Tailwind CSS | **4.2.0** | Config CSS-first, zero config, 5x plus rapide |
| Motion (ex-Framer Motion) | **12.38.0** | Rebrandé "Motion", import depuis `motion/react` |
| React Router | **7.13.1** | SPA mode, combiné avec Remix |
| Zustand | **5.0.12** | State management léger, persist middleware |
| vite-plugin-pwa | **0.17+** | Zero-config PWA, service workers Workbox |

### Starters évalués

| Option | Pour | Contre |
|---|---|---|
| **Vite officiel `react-ts`** | Minimal, maintenu par l'équipe Vite, toujours à jour | Faut ajouter Tailwind, PWA, Router manuellement |
| **Community starters (Vitamin, etc.)** | Pré-configurés | Souvent en retard de versions, dépendances inutiles, risque d'abandon |
| **Scaffold custom** | Exactement ce qu'on veut, rien de plus | Plus de setup initial |

### Sélection : Vite officiel `react-ts` + ajouts ciblés

**Rationale :**
- Les community starters sont souvent bloqués sur Vite 5 ou 6 alors que Vite 8 est disponible avec Rolldown
- Tailwind CSS v4 a changé radicalement (CSS-first config) — la plupart des starters utilisent encore la v3
- Motion a été rebrandé depuis framer-motion — les starters n'ont pas suivi
- Pour un projet de cette taille (~15-20 composants), le setup manuel prend quelques minutes et garantit des versions à jour

**Commande d'initialisation :**

```bash
npm create vite@latest pierrehammer -- --template react-ts
cd pierrehammer
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install motion react-router zustand
npm install -D vite-plugin-pwa
```

**Décisions architecturales fournies par ce setup :**

**Language & Runtime :**
- TypeScript strict mode via template `react-ts`
- Vite 8 avec Rolldown (ESBuild pour dev, Rolldown pour build)
- Node.js 18+

**Styling :**
- Tailwind CSS v4 — configuration CSS-first (plus de `tailwind.config.js`)
- CSS custom properties pour le système multi-thème par faction
- Plugin `@tailwindcss/vite` pour intégration native

**Build Tooling :**
- Vite 8 — HMR instantané, builds optimisés Rolldown
- Code splitting automatique par route
- PWA via `vite-plugin-pwa` (Workbox sous le capot)

**State Management :**
- Zustand — store minimaliste, middleware `persist` pour localStorage
- Pas de Redux, pas de Context API complexe

**Routing :**
- React Router v7 en mode SPA (pas besoin du mode framework/Remix)
- 4 routes principales : Collection, Mes Listes, Catalogue, Profil

**Testing :**
- Vitest (inclus naturellement avec Vite)
- React Testing Library pour tests de composants

**Note :** L'initialisation du projet avec cette commande sera la première story d'implémentation.

## Core Architectural Decisions

### Decision Priority Analysis

**Décisions critiques (bloquent l'implémentation) :**
- Structure JSON des données de jeu (par faction, lazy-loadable)
- Schéma localStorage versionné avec migration
- Organisation des fichiers source
- Stratégie de cache PWA

**Décisions importantes (façonnent l'architecture) :**
- Pattern de composants (fonctionnels + hooks)
- Séparation stores Zustand par domaine
- Pipeline CLI isolé du bundle app

**Décisions reportées (post-MVP) :**
- Tests E2E, monitoring, multi-tenant, backend

### Data Architecture

| Décision | Choix | Rationale |
|---|---|---|
| Structure données de jeu | JSON par faction (lazy loading) | Réduit le chargement initial, permet le pré-cache sélectif par faction jouée |
| Index des factions | `factions.json` léger (~2 Ko) | Chargé au démarrage, contient id/nom/icône/couleurs de chaque faction |
| Fichiers faction | `{faction-id}.json` (~50-200 Ko chacun) | Datasheets, abilities, keywords, wargear, points — tout lié par ID |
| Schéma localStorage | Clé unique `pierrehammer_v1` avec versioning | Migration automatique via Zustand persist middleware |
| Validation import | Schéma vérifié avant écrasement | Protège contre les imports JSON corrompus |
| Images | URLs Wahapedia, cache service worker | Pas de téléchargement local, fallback placeholder si indisponible |

### Authentication & Security

Non applicable — App locale sans backend, sans auth, sans données sensibles. Les données utilisateur restent sur l'appareil du joueur.

### API & Communication Patterns

Non applicable — App 100% client-side. Aucun appel réseau au runtime sauf chargement initial des JSON de jeu et images Wahapedia.

### Frontend Architecture

| Décision | Choix | Rationale |
|---|---|---|
| State management | Zustand 5 avec middleware `persist` | API minimale, persist localStorage intégré, pas de boilerplate |
| Stores | 3 stores séparés (collection, lists, preferences) | Isolation des domaines, re-renders ciblés |
| Routing | React Router v7 mode SPA, 4 routes principales | Correspond aux 4 onglets de navigation |
| Composants | Fonctionnels + hooks, pas de HOC/render props | Simple, lisible, standard React 19 |
| Organisation | `components/ui/` + `components/domain/` + `pages/` | Séparation claire primitives / métier / pages |
| Theming | CSS custom properties + attribut `data-faction` sur `<html>` | Changement de thème instantané, pas de re-render React |
| Animations | Motion (ex-framer-motion) pour transitions + CSS natif pour parallaxe/brillance | Performance optimale, CSS pour les effets haute fréquence |
| Bundle | Code splitting par route (React.lazy + Suspense) | Chargement initial minimal, chaque page chargée à la demande |

### Infrastructure & Deployment

| Décision | Choix | Rationale |
|---|---|---|
| Hébergement | Vercel (gratuit, tier hobby) | Auto-deploy GitHub, CDN global, zero config |
| CI/CD | GitHub → Vercel (auto) | Pas de pipeline CI séparé pour le MVP |
| Environnements | Production uniquement | App privée entre amis, pas besoin de staging |
| PWA Cache | vite-plugin-pwa, stratégie cache-first | App shell + données de jeu pré-cachées, images Wahapedia en cache runtime |
| Pipeline data | Script CLI Node.js dans `src/pipeline/` | Exécuté manuellement par Thomas, hors bundle app |

### Decision Impact Analysis

**Séquence d'implémentation :**
1. Scaffold Vite + installation dépendances
2. Structure de fichiers + configuration Tailwind/PWA
3. Pipeline CSV → JSON (fondation de tout)
4. Stores Zustand + schéma localStorage
5. Système de theming (CSS custom properties)
6. Pages et navigation (React Router)
7. Composants domain (UnitCard, ArmyList, etc.)
8. Service workers et cache

**Dépendances inter-composants :**
- Le pipeline (3) doit être fonctionnel avant les composants domain (7)
- Les stores (4) doivent exister avant les pages (6)
- Le theming (5) doit être en place avant les composants visuels (7)
- Le service worker (8) dépend de la structure finale des assets

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Points de conflit critiques identifiés :** 12 zones couvrant nommage, structure, formats de données, state management et gestion d'erreurs.

### Naming Patterns

**Fichiers & dossiers :**

| Élément | Convention | Exemple |
|---|---|---|
| Composants React | PascalCase + `.tsx` | `UnitCard.tsx`, `ArmyListItem.tsx` |
| Hooks custom | camelCase + prefix `use` + `.ts` | `useCollection.ts`, `useFactionTheme.ts` |
| Stores Zustand | camelCase + suffix `Store` + `.ts` | `collectionStore.ts`, `listsStore.ts` |
| Utilitaires | camelCase + `.ts` | `pointsCalculator.ts`, `csvParser.ts` |
| Types/interfaces | camelCase + `.types.ts` | `gameData.types.ts`, `collection.types.ts` |
| Fichiers de test | même nom + `.test.ts(x)` co-localisé | `UnitCard.test.tsx` à côté de `UnitCard.tsx` |
| Dossiers | kebab-case | `components/ui/`, `game-data/` |
| Données JSON de jeu | kebab-case + `.json` | `space-marines.json`, `factions.json` |
| CSS modules (si besoin) | même nom + `.module.css` | `UnitCard.module.css` |

**Variables & fonctions :**

| Élément | Convention | Exemple |
|---|---|---|
| Variables | camelCase | `unitCount`, `paintStatus` |
| Fonctions | camelCase, verbe en premier | `getUnitById()`, `toggleCollectionView()` |
| Constantes | UPPER_SNAKE_CASE | `MAX_BATTLELINE_UNITS`, `PAINT_STATUSES` |
| Types TypeScript | PascalCase | `Datasheet`, `ArmyList`, `PaintStatus` |
| Interfaces | PascalCase, pas de prefix `I` | `FactionTheme`, pas `IFactionTheme` |
| Enums | PascalCase + valeurs PascalCase | `PaintStatus.InProgress` |
| Props de composants | PascalCase + suffix `Props` | `UnitCardProps`, `ArmyListProps` |
| Event handlers | prefix `on` + verbe | `onAddUnit`, `onChangeStatus` |
| Handler functions | prefix `handle` + verbe | `handleAddUnit`, `handleChangeStatus` |

### Structure Patterns

**Tests co-localisés :**
```
components/domain/UnitCard/
├── UnitCard.tsx
├── UnitCard.test.tsx
└── index.ts          # re-export
```

**Index de barrel exports :** Chaque dossier de composant a un `index.ts` pour des imports propres :
```typescript
// ✅ Bon
import { UnitCard } from '@/components/domain/UnitCard'
// ❌ Mauvais
import { UnitCard } from '@/components/domain/UnitCard/UnitCard'
```

**Alias de chemin :** `@/` pointe vers `src/` (configuré dans `tsconfig.json` et `vite.config.ts`).

**Assets statiques :**
```
public/
├── icons/              # Icônes de faction (SVG)
├── fonts/              # Polices custom (si hébergées localement)
└── manifest.json       # PWA manifest
```

### Format Patterns

**Données de jeu (JSON) :**
- Champs en camelCase dans le JSON (cohérent avec TypeScript)
- IDs string (pas de number) pour les datasheets, factions, abilities
- Dates en ISO 8601 (`"2026-03-31"`)
- Nulls explicites (pas de champs absents pour les valeurs optionnelles)

**Exemple de structure faction JSON :**
```json
{
  "id": "space-marines",
  "name": "Space Marines",
  "datasheets": [
    {
      "id": "sm-intercessors",
      "name": "Intercessors",
      "points": [{ "models": 5, "cost": 80 }],
      "keywords": ["BATTLELINE", "INFANTRY"],
      "abilities": ["ability-id-1"],
      "profiles": { "m": "6\"", "t": 4, "sv": "3+", "w": 2, "ld": "6+", "oc": 2 }
    }
  ]
}
```

**Données utilisateur (localStorage) :**
- camelCase pour toutes les clés
- IDs référencent les IDs des données de jeu
- Timestamps en millisecondes epoch pour les dates internes

### Communication Patterns — State Management

**Stores Zustand — Pattern obligatoire :**

```typescript
// ✅ Pattern standard pour tous les stores
interface CollectionState {
  // State
  items: Record<string, CollectionItem>
  // Actions
  addItem: (datasheetId: string, quantity: number) => void
  removeItem: (datasheetId: string) => void
  updateStatus: (datasheetId: string, status: PaintStatus) => void
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      items: {},
      addItem: (datasheetId, quantity) =>
        set((state) => ({ /* immutable update */ })),
      // ...
    }),
    { name: 'pierrehammer-collection' }
  )
)
```

**Règles Zustand :**
- Toujours utiliser des updates immuables (`set((state) => ({ ...state, ... }))`)
- Actions définies dans le store, pas dans les composants
- Sélecteurs fins pour éviter les re-renders : `useCollectionStore((s) => s.items)`
- Pas de logique métier dans les composants — tout dans les stores ou utils

### Process Patterns

**Gestion d'erreurs :**

| Contexte | Pattern |
|---|---|
| Import JSON invalide | Toast d'erreur + données existantes préservées |
| Image Wahapedia indisponible | Placeholder SVG avec nom de l'unité |
| localStorage plein | Toast d'avertissement + suggestion d'export |
| Données de jeu manquantes | Écran de fallback "données non disponibles" |

**Pas de try/catch global** — Erreurs gérées au plus près du point de défaillance. Un `ErrorBoundary` React à la racine comme filet de sécurité uniquement.

**Loading states :**

| Pattern | Convention |
|---|---|
| Nommage | `isLoading`, `isLoadingFaction` (prefix `isLoading`) |
| Squelette | Skeleton components pour les cartes et fiches |
| Transition | Motion `AnimatePresence` pour les transitions loading → content |
| Données de jeu | Chargées au premier accès à une faction, ensuite en cache |

**Composants — Pattern obligatoire :**

```typescript
// ✅ Pattern standard pour les composants
interface UnitCardProps {
  datasheet: Datasheet
  owned?: number
  onAddToList?: (datasheetId: string) => void
}

export function UnitCard({ datasheet, owned = 0, onAddToList }: UnitCardProps) {
  // hooks en premier
  const theme = useFactionTheme()

  // handlers
  const handleAdd = () => onAddToList?.(datasheet.id)

  // render
  return (...)
}
```

**Règles composants :**
- Fonctions nommées (`export function`, pas `export const X = () =>`)
- Props destructurées dans la signature
- Hooks en premier, handlers ensuite, render à la fin
- Pas de logique complexe dans le JSX — extraire dans des variables ou fonctions
- Pas de `any` — typer explicitement tout

### Enforcement Guidelines

**Tous les agents AI DOIVENT :**

1. Utiliser les conventions de nommage ci-dessus sans exception
2. Co-localiser les tests avec leurs composants
3. Utiliser l'alias `@/` pour tous les imports internes
4. Définir les actions dans les stores Zustand, pas dans les composants
5. Utiliser des updates immuables dans les stores
6. Typer explicitement toutes les props et retours de fonctions
7. Utiliser `export function` (pas `export const ... = () =>`) pour les composants
8. Ne jamais utiliser `any` — utiliser `unknown` si le type est réellement inconnu

**Anti-patterns à éviter :**

```typescript
// ❌ Props non typées
export const Card = (props) => { ... }

// ❌ Logique métier dans le composant
export function UnitCard({ id }) {
  const points = datasheets.find(d => d.id === id).points[0].cost // ← dans le store
}

// ❌ State local pour des données persistées
const [collection, setCollection] = useState({}) // ← utiliser le store

// ❌ Import relatif profond
import { UnitCard } from '../../../components/domain/UnitCard/UnitCard'
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
pierrehammer/
├── .github/
│   └── workflows/              # (futur, si CI GitHub Actions)
├── public/
│   ├── icons/                  # Icônes de faction (SVG)
│   │   ├── space-marines.svg
│   │   ├── orks.svg
│   │   └── ...
│   ├── fonts/                  # Polices display (Oswald, Cinzel, etc.)
│   ├── favicon.svg
│   └── manifest.json           # PWA manifest
├── pipeline/                   # Script CLI — HORS bundle app
│   ├── package.json            # Dépendances pipeline (csv-parse, etc.)
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts            # Point d'entrée CLI
│   │   ├── download.ts         # Téléchargement CSV Wahapedia
│   │   ├── parse.ts            # Parsing CSV → objets TypeScript
│   │   ├── transform.ts        # Transformation → JSON app
│   │   ├── validate.ts         # Validation schéma sortie
│   │   └── types.ts            # Types partagés pipeline
│   ├── csv/                    # CSV Wahapedia téléchargés (gitignored)
│   └── output/                 # JSON générés → copiés dans src/data/
├── src/
│   ├── main.tsx                # Point d'entrée React
│   ├── App.tsx                 # Layout racine + Router + ErrorBoundary
│   ├── index.css               # Tailwind directives + CSS custom properties base
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── ui/                 # Primitives réutilisables
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Badge/
│   │   │   ├── Card/
│   │   │   ├── SearchBar/
│   │   │   ├── Toggle/
│   │   │   ├── Toast/
│   │   │   ├── ProgressBar/
│   │   │   ├── Skeleton/
│   │   │   └── BottomNav/
│   │   ├── domain/             # Composants métier W40K
│   │   │   ├── UnitCard/
│   │   │   │   ├── UnitCard.tsx
│   │   │   │   ├── UnitCard.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── AnimatedCard/       # Phase 2 — code fourni par Thomas
│   │   │   ├── UnitSheet/          # Fiche fusionnée scrollable
│   │   │   ├── ArmyListItem/
│   │   │   ├── PaintStatusBadge/
│   │   │   ├── PointsCounter/
│   │   │   ├── FactionPicker/
│   │   │   ├── DetachmentPicker/
│   │   │   └── CollectionToggle/
│   │   └── layout/
│   │       ├── AppShell/           # Layout principal (header + bottom nav + content)
│   │       ├── PageHeader/
│   │       └── ErrorBoundary/
│   ├── pages/
│   │   ├── Collection/
│   │   │   ├── CollectionPage.tsx      # FR6-FR10
│   │   │   ├── CollectionPage.test.tsx
│   │   │   └── index.ts
│   │   ├── Lists/
│   │   │   ├── ListsPage.tsx           # FR11-FR17
│   │   │   ├── ListDetailPage.tsx      # FR13-FR16
│   │   │   ├── ListsPage.test.tsx
│   │   │   └── index.ts
│   │   ├── Catalog/
│   │   │   ├── CatalogPage.tsx         # FR19-FR23
│   │   │   ├── UnitDetailPage.tsx      # FR19-FR21
│   │   │   ├── CatalogPage.test.tsx
│   │   │   └── index.ts
│   │   ├── Profile/
│   │   │   ├── ProfilePage.tsx         # FR32-FR33, FR4
│   │   │   └── index.ts
│   │   └── GameMode/                   # Phase 2
│   │       ├── GameModePage.tsx        # FR24-FR26
│   │       └── index.ts
│   ├── stores/
│   │   ├── collectionStore.ts          # Collection : items, quantités, statuts
│   │   ├── listsStore.ts               # Listes d'armée : CRUD, calcul points
│   │   ├── preferencesStore.ts         # Préférences : faction active, thème
│   │   └── gameDataStore.ts            # Cache des données de jeu chargées
│   ├── hooks/
│   │   ├── useFactionTheme.ts          # Applique le thème CSS selon la faction
│   │   ├── useGameData.ts              # Charge les données d'une faction (lazy)
│   │   ├── usePointsCalculator.ts      # Calcul de points temps réel
│   │   ├── useSearch.ts                # Recherche/filtre unités
│   │   └── useExportImport.ts          # Export/import JSON utilisateur
│   ├── data/                           # JSON statiques (générés par pipeline)
│   │   ├── factions.json               # Index léger de toutes les factions
│   │   ├── space-marines.json
│   │   ├── orks.json
│   │   ├── tyranids.json
│   │   └── ...                         # Un fichier par faction
│   ├── theme/
│   │   ├── factions.css                # CSS custom properties par faction
│   │   ├── base.css                    # Tokens de design de base (dark mode)
│   │   └── animations.css              # Keyframes parallaxe, brillance (Phase 2)
│   ├── types/
│   │   ├── gameData.types.ts           # Faction, Datasheet, Ability, Keyword
│   │   ├── collection.types.ts         # CollectionItem, PaintStatus
│   │   ├── armyList.types.ts           # ArmyList, ListUnit
│   │   └── common.types.ts             # Types utilitaires partagés
│   └── utils/
│       ├── pointsCalculator.ts         # Logique de calcul de points
│       ├── compositionValidator.ts     # Validation règles W40K (Phase 2)
│       ├── dataLoader.ts               # Chargement lazy des JSON par faction
│       ├── storageValidator.ts         # Validation schéma import JSON
│       └── constants.ts                # Constantes (PAINT_STATUSES, GAME_SIZES)
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                      # Vite + Tailwind + PWA plugins
├── .gitignore
└── .env.example
```

### Architectural Boundaries

```
┌─────────────────────────────────────────────┐
│                   App Shell                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Collection│ │  Lists   │ │ Catalog  │    │
│  │  Page    │ │  Page    │ │  Page    │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘    │
│       │             │             │          │
│  ┌────▼─────────────▼─────────────▼────┐    │
│  │      Domain Components Layer        │    │
│  │  UnitCard | UnitSheet | ArmyList    │    │
│  └────────────────┬────────────────────┘    │
│                   │                          │
│  ┌────────────────▼────────────────────┐    │
│  │         Stores (Zustand)            │    │
│  │  collection | lists | preferences  │    │
│  └────────────────┬────────────────────┘    │
│                   │                          │
│  ┌────────────────▼────────────────────┐    │
│  │      Data Layer (JSON statique)     │    │
│  │  factions.json | {faction}.json     │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        Pipeline (hors app, CLI séparé)       │
│  CSV Wahapedia → parse → transform → JSON   │
└─────────────────────────────────────────────┘
```

**Règles de communication :**
- Pages → Domain Components (props descendantes)
- Domain Components → Stores (hooks Zustand, lecture directe)
- Stores → localStorage (middleware persist, automatique)
- Pages/Components → Data Layer (hook `useGameData`, lazy loading)
- Pipeline → Data Layer (copie de fichiers au build, pas de runtime)

**Data Boundaries :**

| Boundary | Données | Accès | Mutation |
|---|---|---|---|
| JSON statique (`src/data/`) | Données de jeu Wahapedia | Lecture seule, lazy par faction | Jamais au runtime — pipeline uniquement |
| Zustand stores | Collection, listes, préférences | Hooks dans composants | Actions dans les stores |
| localStorage | Persistance des stores | Automatique via middleware persist | Via stores uniquement |
| Service Worker cache | App shell + JSON + images | Transparent, cache-first | Invalidation au build |

### Requirements to Structure Mapping

| FRs | Domaine | Fichiers principaux |
|---|---|---|
| FR1-FR5 | Pipeline & données de jeu | `pipeline/src/`, `src/data/`, `src/utils/dataLoader.ts`, `src/stores/gameDataStore.ts` |
| FR6-FR10 | Collection | `src/pages/Collection/`, `src/stores/collectionStore.ts`, `src/components/domain/PaintStatusBadge/` |
| FR11-FR18 | Army builder | `src/pages/Lists/`, `src/stores/listsStore.ts`, `src/utils/pointsCalculator.ts` |
| FR19-FR23 | Fiches d'unités | `src/pages/Catalog/`, `src/components/domain/UnitSheet/`, `src/hooks/useSearch.ts` |
| FR24-FR26 | Mode partie (Phase 2) | `src/pages/GameMode/`, `src/components/domain/AnimatedCard/` |
| FR27-FR30 | Identité visuelle (Phase 2) | `src/theme/`, `src/hooks/useFactionTheme.ts` |
| FR31-FR34 | Persistance & offline | `src/stores/`, `src/hooks/useExportImport.ts`, `vite.config.ts` |
| FR35-FR38 | Navigation & UX | `src/App.tsx`, `src/components/layout/AppShell/`, `src/components/ui/BottomNav/` |

### Data Flow

```
Wahapedia CSV ──→ Pipeline CLI ──→ JSON files ──→ Build (Vite)
                                                      │
                                                      ▼
                                              Static hosting (Vercel)
                                                      │
                                                      ▼
                                              Service Worker cache
                                                      │
                                                      ▼
                                    useGameData() ──→ gameDataStore
                                                      │
                                                      ▼
                              Domain Components ←── Zustand stores
                                                      │
                                                      ▼
                                              localStorage (persist)
                                                      │
                                                      ▼
                                              Export JSON (backup)
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility :**
Toutes les technologies sont compatibles entre elles — versions vérifiées mars 2026. Vite 8 + React 19 + Tailwind v4 + Motion 12 + React Router 7 + Zustand 5 + vite-plugin-pwa forment une stack cohérente sans conflits de versions ni d'API.

**Pattern Consistency :**
Conventions de nommage uniformes (PascalCase composants, camelCase fonctions, kebab-case data). Patterns Zustand identiques sur les 3 stores. Structure composants uniforme (hooks → handlers → render).

**Structure Alignment :**
Séparation pipeline/app/données respectée. Tests co-localisés. Alias `@/` configuré. Boundaries claires entre couches.

### Requirements Coverage Validation ✅

**Functional Requirements :** 38/38 FRs couverts architecturalement — chaque FR mappé à des fichiers spécifiques dans la structure projet.

**Non-Functional Requirements :** 17/17 NFRs couvertes — performance (code splitting, lazy loading, Rolldown), offline (PWA cache-first), maintenabilité (pipeline séparé, types stricts), compatibilité (mobile-first, Tailwind).

### Implementation Readiness Validation ✅

**Decision Completeness :** Stack complète avec versions, commande d'initialisation, patterns avec exemples de code et anti-patterns.

**Structure Completeness :** Arborescence complète, mapping FRs → fichiers, diagrammes de boundaries et data flow.

**Pattern Completeness :** 8 règles d'enforcement, conventions exhaustives, exemples positifs et négatifs.

### Gap Analysis Results

**Gaps critiques :** Aucun

**Gaps importants (non bloquants) :**
1. Schéma TypeScript détaillé des données de jeu — sera défini lors du pipeline (première story)
2. Configuration exacte vite-plugin-pwa — sera affinée lors de l'implémentation service worker

**Gaps nice-to-have :**
- Documentation scripts npm
- Convention de commit messages
- Stratégie de branches Git

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Contexte projet analysé en profondeur
- [x] Complexité évaluée (basse)
- [x] Contraintes techniques identifiées
- [x] Préoccupations transversales mappées

**✅ Architectural Decisions**
- [x] Décisions critiques documentées avec versions
- [x] Stack technique complètement spécifiée
- [x] Patterns d'intégration définis
- [x] Considérations performance adressées

**✅ Implementation Patterns**
- [x] Conventions de nommage établies
- [x] Patterns structurels définis
- [x] Patterns de communication spécifiés
- [x] Patterns de processus documentés

**✅ Project Structure**
- [x] Structure de répertoires complète
- [x] Limites de composants établies
- [x] Points d'intégration mappés
- [x] Mapping exigences → structure complet

### Architecture Readiness Assessment

**Statut global : PRÊT POUR L'IMPLÉMENTATION**

**Niveau de confiance : Élevé**

**Forces clés :**
- Architecture simple et directe — pas de sur-ingénierie
- Stack moderne et cohérente avec versions vérifiées
- Séparation claire pipeline / app / données
- Patterns concrets avec exemples de code
- Extensible pour Phase 2, V1.5, V2 sans refonte

**Améliorations futures :**
- Schéma TypeScript détaillé des données de jeu (lors du pipeline)
- Configuration PWA fine (lors de l'implémentation service worker)
- Tests E2E avec Playwright (V1.5)

### Implementation Handoff

**Guidelines pour agents AI :**
- Suivre toutes les décisions architecturales exactement comme documentées
- Utiliser les patterns d'implémentation de manière cohérente
- Respecter la structure projet et les boundaries
- Consulter ce document pour toute question architecturale

**Première priorité d'implémentation :**
```bash
npm create vite@latest pierrehammer -- --template react-ts
```
Suivi de la configuration Tailwind, PWA, et du pipeline CSV → JSON.
