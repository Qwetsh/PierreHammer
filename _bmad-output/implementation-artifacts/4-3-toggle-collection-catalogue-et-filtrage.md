# Story 4.3: Toggle Collection / Catalogue et filtrage

Status: review

## Story

As a joueur,
I want basculer entre "ma collection" et "tout le catalogue" et filtrer par faction, statut ou nom,
so that je retrouve rapidement ce que je cherche dans mes figurines.

## Acceptance Criteria

1. Bascule entre "ma collection" (possédées uniquement) et "tout le catalogue" (FR8, UX-DR10)
2. Fond primary indique l'option active
3. Filtrer par faction, mot-clé, statut de peinture ou nom d'unité (FR10)
4. Filtrage en temps réel < 100ms, même avec 200+ unités (NFR4)
5. Si aucun résultat, état vide avec CTA affiché

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Créer src/components/domain/CollectionToggle/
  - [x] CollectionToggle.tsx: segmented control 2 options ("Ma collection" / "Tout")
  - [x] Props: value ('owned' | 'all'), onChange
  - [x] Fond primary sur l'option active, bg-surface sur l'inactive
  - [x] CollectionToggle.test.tsx, index.ts
- [x] Task 2 (AC: #1): Mettre à jour CollectionPage.tsx
  - [x] Ajouter CollectionToggle en haut de la page
  - [x] Filtrer les unités: si 'owned', ne montrer que celles présentes dans collectionStore
  - [x] Afficher les UnitCards de toutes les factions (pas seulement une)
  - [x] Charger les données de toutes les factions possédées au mount
- [x] Task 3 (AC: #3, #4): Ajouter filtres dans CollectionPage
  - [x] SearchBar pour filtrage par nom/mot-clé (réutiliser useSearch)
  - [x] Filtre par faction (dropdown ou chips)
  - [x] Filtre par statut de peinture (chips: tous, non montée, montée, en cours, terminée)
  - [x] Combiner les filtres avec useSearch et useMemo
- [x] Task 4 (AC: #5): État vide
  - [x] Collection vide: "Tu n'as pas encore ajouté de figurines" + CTA "Explorer le catalogue"
  - [x] Filtre sans résultat: "Aucune figurine ne correspond" + CTA "Réinitialiser les filtres"

## Dev Notes

- La CollectionPage affiche des unités de TOUTES les factions possédées, contrairement au CatalogPage qui est mono-faction
- Le filtrage combine: toggle (owned/all) + recherche texte + faction + statut peinture. Utiliser useMemo pour la chaîne de filtres
- Le CollectionToggle est un simple segmented control, pas un vrai composant Tabs

### References
- [Source: planning-artifacts/ux-design-specification.md#UX-DR10 CollectionToggle]

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Completion Notes List
- CollectionToggle: segmented control avec role="radiogroup", aria-checked, fond primary actif
- CollectionPage: toggle owned/all, SearchBar, chips faction, chips paint status, chaîne de filtres via useMemo
- Charge automatiquement les factions des items possédés au mount
- EmptyState: collection vide → "Explorer le catalogue", filtre vide → "Réinitialiser les filtres"
- 4 tests CollectionToggle, 90 tests total passent
### File List
- src/components/domain/CollectionToggle/CollectionToggle.tsx (new)
- src/components/domain/CollectionToggle/CollectionToggle.test.tsx (new)
- src/components/domain/CollectionToggle/index.ts (new)
- src/pages/Collection/CollectionPage.tsx (rewritten)
