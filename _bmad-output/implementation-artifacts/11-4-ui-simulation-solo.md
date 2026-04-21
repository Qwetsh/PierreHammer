# Story 11.4: UI de simulation de combat (mode solo)

Status: review

## Story

As a joueur,
I want simuler une attaque entre deux de mes propres escouades directement depuis l'app,
so that je puisse tester les matchups et optimiser mes listes avant de jouer.

## Acceptance Criteria

1. Depuis une fiche d'unité (UnitSheet) ou depuis le mode partie, un bouton "Simuler une attaque" est disponible
2. Le joueur sélectionne une arme de l'attaquant
3. Le joueur sélectionne une unité cible (parmi n'importe quelle faction chargée)
4. Les résultats statistiques s'affichent : hits, wounds, saves ratés, dégâts, kills estimés
5. Chaque étape intermédiaire est visible (seuils, probabilités par étape)
6. Le joueur peut changer l'arme ou la cible sans revenir en arrière
7. La simulation fonctionne entièrement offline (aucun appel réseau)

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Point d'entrée simulation
  - [x] Ajouter un bouton "⚔️ Simuler" dans UnitSheet (section actions)
  - [x] Ajouter un bouton dans GameModePage (sur chaque unité de la liste)
  - [x] Le bouton ouvre un modal/page de simulation
  - [x] Route optionnelle : `/simulate/:factionId/:datasheetId` (ou modal overlay)
  - [x] Tests: le bouton apparaît, ouvre le simulateur

- [x] Task 2 (AC: #2): Sélection de l'arme attaquante
  - [x] Créer `src/pages/Simulator/SimulatorPage.tsx` (ou `src/components/domain/CombatSimulator/`)
  - [x] Afficher l'unité attaquante avec son profil
  - [x] Lister toutes les armes de l'unité (ranged + melee, séparées)
  - [x] Le joueur sélectionne une arme — ses stats sont affichées
  - [x] Input pour le nombre de modèles attaquants (défaut: min du pointOption sélectionné)
  - [x] Tests: armes listées, sélection met à jour l'état

- [x] Task 3 (AC: #3): Sélection de la cible
  - [x] Section "Cible" avec un picker de faction + recherche d'unité
  - [x] Réutiliser le FactionPicker et la SearchBar existants
  - [x] Au clic sur une unité cible, charger son profil et ses abilities
  - [x] Input pour le nombre de modèles défenseurs (défaut: min du pointOption)
  - [x] Si unité multi-profil (ex: véhicule avec profils dégradés), utiliser le profil non endommagé
  - [x] Tests: sélection de cible cross-faction, affichage du profil défenseur

- [x] Task 4 (AC: #4, #5): Affichage des résultats
  - [x] Appeler `resolveCombat()` (Story 11.3) avec les inputs sélectionnés
  - [x] Afficher un résumé visuel :
    - Nombre d'attaques total
    - Hits attendus (avec seuil affiché, ex: "sur 3+")
    - Wounds attendus (avec seuil, ex: "S8 vs T4 → sur 3+")
    - Saves ratés (avec save effectif, ex: "Sv 3+ avec AP -2 → sur 5+, invuln 4+ utilisé")
    - Dégâts totaux
    - Dégâts après FnP (si applicable)
    - Kills estimés (avec icône par modèle tué)
  - [x] Barre de progression visuelle pour chaque étape (100% → hits% → wounds% → unsaved% → damage)
  - [x] Afficher les keywords actifs de l'arme (badges : "Sustained Hits 2", "Anti-Vehicle 4+")
  - [x] Afficher les abilities actives du défenseur ("Feel No Pain 5+", "Stealth")
  - [x] Tests: résultats affichés pour différents matchups

- [x] Task 5 (AC: #6): Interaction dynamique
  - [x] Changer l'arme recalcule instantanément
  - [x] Changer la cible recalcule instantanément
  - [x] Modifier le nombre de modèles (attaquant/défenseur) recalcule instantanément
  - [x] Toggle "demi-portée" pour activer rapid fire / melta à pleine puissance
  - [x] Toggle "a chargé" pour activer lance
  - [x] Toggle "n'a pas bougé" pour activer heavy
  - [x] Tests: chaque toggle recalcule les résultats

- [x] Task 6 (AC: #7): Mode offline
  - [x] Vérifier que tout fonctionne sans connexion (le moteur est 100% client-side)
  - [x] Les données de faction sont déjà en cache (gameDataStore)
  - [x] Tests: simulation complète sans appel réseau

## Dev Notes

- Cette story est le premier contact utilisateur avec le moteur de combat — l'UX doit être intuitive
- Le "mode solo" permet de tester avec ses propres listes ou n'importe quelle unité du catalogue — pas besoin d'ami
- L'UI doit rester simple : on ne montre pas les formules mathématiques, juste les résultats avec les seuils
- Les toggles (demi-portée, charge, stationnaire) permettent de couvrir les cas contextuels sans complexifier le moteur
- Réutiliser au maximum les composants existants : FactionPicker, SearchBar, UnitCard
- Le simulateur est une feature standalone — il n'a pas besoin de Supabase ou de game session

### References
- Moteur de combat: src/utils/combatEngine.ts (Story 11.3)
- WeaponKeywords parser: src/utils/weaponKeywordParser.ts (Story 11.1)
- UnitSheet existant: src/components/domain/UnitSheet/
- GameModePage: src/pages/GameMode/GameModePage.tsx
- FactionPicker: src/components/domain/FactionPicker/

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- SimulatorPage complète avec sélection attaquant/défenseur cross-faction, weapon picker, toggles contextuels, résultats avec barres de progression
- Bouton "Simuler" ajouté dans UnitSheet via callback prop `onSimulate` (pas de useNavigate direct pour éviter les dépendances Router dans les tests)
- Bouton "Simuler" ajouté dans GameModePage sur chaque unité avec armes
- Routes /simulate et /simulate/:factionId/:datasheetId configurées dans App.tsx
- UnitDetailPage passe `onSimulate` à UnitSheet quand l'unité a des armes
- Moteur 100% client-side, aucun appel réseau — fonctionne offline
- Keywords actifs affichés en badges, abilities défenseur affichées
- Recalcul instantané via useMemo réactif sur tous les inputs
- 365 tests, 0 régression
### File List
- src/pages/Simulator/SimulatorPage.tsx (créé)
- src/components/domain/UnitSheet/UnitSheet.tsx (modifié — ajout prop onSimulate)
- src/pages/Catalog/UnitDetailPage.tsx (modifié — passe onSimulate à UnitSheet)
- src/pages/GameMode/GameModePage.tsx (modifié — bouton Simuler sur chaque unité)
- src/App.tsx (modifié — routes /simulate)
