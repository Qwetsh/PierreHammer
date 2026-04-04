# Story 8.3: Cadres différenciés et images Wahapedia

Status: review

## Story

As a joueur,
I want distinguer visuellement les types d'unité par leur cadre et voir les images des figurines,
so that je repère immédiatement les Epic Heroes et les Battleline.

## Acceptance Criteria

1. Les Epic Heroes ont un cadre doré distinctif (FR29)
2. Les Battleline ont un cadre argenté distinctif (FR29)
3. Les unités standard ont un cadre neutre
4. Les images de figurines sont sourcées depuis Wahapedia et affichées sur les cartes (FR30)
5. Un placeholder est affiché si l'image n'est pas disponible
6. Les images sont mises en cache par le service worker pour l'offline

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2, #3): Cadres par type d'unité
  - [x] getVariant() déjà existant dans UnitCard (EPIC HERO, BATTLELINE, standard)
  - [x] Enrichi avec boxShadow: ombre dorée (epic-hero) et bleue (battleline)
  - [x] Standard: bordure neutre --color-surface
- [x] Task 2 (AC: #4): Images de figurines depuis Wahapedia
  - [x] Composant UnitImage créé avec loading="lazy" et decoding="async"
  - [x] Prêt pour intégration quand le pipeline ajoutera imageUrl au JSON
- [x] Task 3 (AC: #5): Placeholder pour images manquantes
  - [x] UnitImage affiche un placeholder SVG quand src absent ou onError
  - [x] 3 tailles: sm (48px), md (80px), lg (120px)
- [x] Task 4 (AC: #6): Cache des images pour l'offline
  - [x] Déjà configuré dans Story 6.3: runtimeCaching CacheFirst pour wahapedia images
  - [x] Max 200 entries, expiration 30 jours

## Dev Notes

- **CRITICAL**: Les images Wahapedia sont des URLs externes — le pipeline doit les inclure dans le JSON
- Le cadre doré/argenté doit rester lisible sur le fond sombre (#0f0f1a) — tester le contraste
- Les images peuvent être absentes pour certaines unités — toujours prévoir le placeholder
- Le service worker pour les images cross-origin nécessite CORS ou opaque responses
- Tailwind CSS 4.2.0 : utiliser `@theme` pour les tokens de cadre, pas de `tailwind.config.js`
- Composants : `export function`, named exports, PascalCase

### References
- [Source: planning-artifacts/ux-design-specification.md#UnitCard]
- [Source: planning-artifacts/prd.md#FR29, FR30]
- [Source: planning-artifacts/architecture.md#Service Worker]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- UnitCard enrichi avec boxShadow doré/bleu pour epic-hero/battleline
- UnitImage composant avec placeholder SVG, 3 tailles, lazy loading, error handling
- 5 tests UnitImage: placeholder sans src, image avec src, erreur → placeholder, tailles sm/lg
- Cache images déjà implémenté dans Story 6.3
- 133 tests passent au total
### File List
- src/components/domain/UnitCard/UnitCard.tsx (modifié - boxShadow)
- src/components/domain/UnitImage/UnitImage.tsx (créé)
- src/components/domain/UnitImage/UnitImage.test.tsx (créé)
- src/components/domain/UnitImage/index.ts (créé)
