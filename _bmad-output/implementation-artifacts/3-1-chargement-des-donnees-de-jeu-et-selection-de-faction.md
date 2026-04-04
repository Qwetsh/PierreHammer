# Story 3.1: Chargement des données de jeu et sélection de faction

Status: review

## Story

As a joueur,
I want choisir une faction et voir ses unités se charger,
so that je puisse explorer le catalogue de ma faction.

## Acceptance Criteria

1. Le gameDataStore charge factions.json (index léger) au premier accès au Catalogue
2. Un FactionSelector affiche les factions disponibles avec preview du skin
3. Quand le joueur sélectionne une faction, le JSON {faction-id}.json est chargé en lazy loading
4. L'attribut data-faction sur <html> est mis à jour pour appliquer la palette
5. La date de dernière mise à jour des données est visible (FR4)

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Créer src/types/gameData.types.ts
  - [x] Types: Faction, FactionIndex, Datasheet, Ability, Keyword, Profile, Weapon, PointOption
  - [x] FactionIndex: { lastUpdate: string, factions: FactionSummary[] }
  - [x] FactionSummary: { id: string, name: string, slug: string, datasheetCount: number }
- [x] Task 2 (AC: #1): Créer src/stores/gameDataStore.ts
  - [x] State: factionIndex, loadedFactions, selectedFactionSlug, isLoading, error
  - [x] Action: loadFactionIndex() — fetch /data/factions.json
  - [x] Action: loadFaction(slug) — fetch /data/{slug}.json, cache in loadedFactions
  - [x] PAS de persist middleware
- [x] Task 3 (AC: #1): Créer src/utils/dataLoader.ts
  - [x] Fonction loadJSON<T>(path) — fetch + parse, gestion d'erreurs
- [x] Task 4 (AC: #2): Créer src/components/domain/FactionPicker/
  - [x] FactionPicker.tsx: grille responsive avec nom, couleur et compteur
  - [x] FactionPicker.test.tsx (3 tests), index.ts
- [x] Task 5 (AC: #3, #4): Créer src/hooks/useGameData.ts
  - [x] Hook: charge l'index au mount, expose les factions
  - [x] Hook: charge faction à la demande, met à jour data-faction via useFactionTheme
- [x] Task 6 (AC: #5): Afficher lastUpdate
  - [x] Date visible dans CatalogPage: "Données à jour au {date}"
- [x] Task 7: Mettre à jour CatalogPage.tsx
  - [x] FactionPicker si aucune faction sélectionnée, info faction sinon

## Dev Notes

- CRITICAL: gameDataStore n'utilise PAS persist middleware — c'est du cache de données de jeu, pas des données utilisateur
- CRITICAL: Les JSON sont dans public/data/ et servis statiquement. Fetch avec chemin relatif: fetch('/data/factions.json')
- Le hook useGameData combine gameDataStore et useFactionTheme pour une API simple dans les composants
- Le FactionPicker est aussi utilisé dans Epic 5 (création de liste) — le rendre réutilisable

### References
- [Source: planning-artifacts/architecture.md#Data Architecture]
- [Source: planning-artifacts/architecture.md#Communication Patterns - State Management]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- ✅ Types gameData complets (FactionIndex, FactionSummary, Faction, Datasheet, etc.)
- ✅ gameDataStore Zustand sans persist — cache de données de jeu avec lazy loading
- ✅ dataLoader utility avec gestion d'erreurs HTTP
- ✅ FactionPicker grille responsive avec preview couleurs par faction
- ✅ useGameData hook combinant store + useFactionTheme
- ✅ CatalogPage: FactionPicker si pas de sélection, infos faction sinon, lastUpdate visible
- ✅ 39 tests passent, 0 régressions

### File List
- src/types/gameData.types.ts (nouveau)
- src/stores/gameDataStore.ts (nouveau)
- src/utils/dataLoader.ts (nouveau)
- src/hooks/useGameData.ts (nouveau)
- src/components/domain/FactionPicker/FactionPicker.tsx (nouveau)
- src/components/domain/FactionPicker/FactionPicker.test.tsx (nouveau — 3 tests)
- src/components/domain/FactionPicker/index.ts (nouveau)
- src/pages/Catalog/CatalogPage.tsx (modifié — FactionPicker + lastUpdate)

### Change Log
- 2026-04-01: Story 3.1 implémentée — chargement données de jeu, store Zustand, FactionPicker, sélection faction avec thème dynamique
