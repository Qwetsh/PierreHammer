# Story 3.4: Recherche et filtrage dans le catalogue

Status: review

## Story

As a joueur,
I want rechercher une unité par nom ou mot-clé dans le catalogue,
so that je trouve rapidement ce que je cherche sans parcourir toute la liste.

## Acceptance Criteria

1. Résultats se filtrent en temps réel < 100ms (NFR4, UX-DR14)
2. Recherche fonctionne sur le nom de l'unité et les mots-clés
3. Si aucun résultat, état vide avec message bienveillant affiché
4. Fonctionne même avec 200+ unités sans ralentissement

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2, #4): Créer src/hooks/useSearch.ts
  - [x] Hook: useSearch(items, query, fields) — filtre générique
  - [x] Recherche case-insensitive sur les champs spécifiés
  - [x] Utiliser useMemo pour la performance (pas de re-calcul si query/items n'ont pas changé)
  - [x] Optimisation: si query < 2 chars, retourner tous les items
- [x] Task 2: Intégrer SearchBar + useSearch dans CatalogPage
  - [x] SearchBar en haut de la grille (après le header faction)
  - [x] Filtrer les datasheets par name et keywords
  - [x] Afficher le nombre de résultats: "X unités trouvées"
- [x] Task 3 (AC: #3): État vide pour résultats
  - [x] Utiliser EmptyState component (créé dans Story 1.4)
  - [x] Message: "Aucune unité trouvée pour '{query}'"
  - [x] CTA: "Effacer la recherche"

## Dev Notes

- CRITICAL: Le hook useSearch doit être performant avec 200+ items. useMemo + string.includes() est suffisant pour cette taille
- Le SearchBar component existe déjà (Story 1.4). Ici on l'intègre dans CatalogPage avec le hook useSearch
- La recherche par keywords cherche dans le tableau keywords de chaque datasheet (ex: "BATTLELINE", "INFANTRY", "PSYKER")
- Pas de fuzzy search au MVP — exact substring match suffit

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR14 SearchBar]
- [Source: planning-artifacts/architecture.md#hooks/useSearch.ts]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- useSearch: hook générique avec useMemo, case-insensitive, seuil 2 chars, extractor callback
- CatalogPage: SearchBar intégrée, compteur "X unités trouvées", EmptyState avec CTA "Effacer la recherche"
- 8 tests useSearch couvrent: empty query, short query, name match, keyword match, case-insensitive, no match, partial match, whitespace trim
### File List
- src/hooks/useSearch.ts (new)
- src/hooks/useSearch.test.ts (new)
- src/pages/Catalog/CatalogPage.tsx (modified)
