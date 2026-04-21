---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-03-31'
inputDocuments:
  - "planning-artifacts/prd.md"
  - "planning-artifacts/architecture.md"
  - "planning-artifacts/ux-design-specification.md"
---

# PierreHammer - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for PierreHammer, decomposing the requirements from the PRD, UX Design and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Thomas peut exécuter un script CLI qui télécharge les CSV Wahapedia et les transforme en JSON optimisé pour l'app
- FR2: Le pipeline peut parser les fichiers CSV Wahapedia (Factions, Datasheets, Abilities, Keywords, Models, Wargear, Points) et les lier par identifiants
- FR3: Le pipeline peut détecter si les données Wahapedia ont été mises à jour en comparant `Last_update.csv`
- FR4: L'app peut afficher la date de dernière mise à jour des données de jeu
- FR5: L'app peut fonctionner avec les données JSON intégrées au build, sans appel réseau au runtime
- FR6: Le joueur peut marquer une unité comme possédée et définir la quantité possédée
- FR7: Le joueur peut attribuer un statut de progression à chaque figurine (non montée, montée, en cours de peinture, terminée)
- FR8: Le joueur peut basculer l'affichage entre "ma collection" et "tout le catalogue"
- FR9: Le joueur peut voir une barre de progression de sa collection (pourcentage par statut)
- FR10: Le joueur peut filtrer et rechercher dans sa collection par faction, mot-clé, statut de peinture ou nom d'unité
- FR11: Le joueur peut créer, nommer, sauvegarder et supprimer des listes d'armée
- FR12: Le joueur peut sélectionner une faction et un détachement pour une liste
- FR13: Le joueur peut ajouter et retirer des unités d'une liste
- FR14: Le joueur peut voir le total de points de sa liste mis à jour en temps réel
- FR15: Le joueur peut recevoir une alerte visuelle quand sa liste dépasse la limite de points sélectionnée (1000 / 2000 / 3000)
- FR16: Le joueur peut distinguer visuellement les unités possédées des unités non possédées dans l'army builder
- FR17: Le joueur peut gérer plusieurs listes simultanément
- FR18: Le joueur peut valider la composition de sa liste selon les règles W40K (max 6 BATTLELINE, max 3 Enhancements, Epic Heroes uniques) *(Phase 2)*
- FR19: Le joueur peut consulter la fiche complète d'une unité sur une seule vue scrollable (stats, équipement, capacités, mots-clés, points)
- FR20: Le joueur peut voir sur la fiche d'unité le nombre de figurines possédées et leur statut de peinture
- FR21: Le joueur peut ajouter une unité à une liste directement depuis sa fiche
- FR22: Le joueur peut parcourir les unités par faction
- FR23: Le joueur peut rechercher une unité par nom ou mot-clé
- FR24: Le joueur peut activer un mode partie qui affiche uniquement les unités de la liste active
- FR25: Le joueur peut naviguer entre les fiches d'unités de sa liste par swipe horizontal *(Phase 2)*
- FR26: Le joueur peut consulter les fiches en mode partie avec un texte agrandi lisible à distance de bras *(Phase 2)*
- FR27: L'app peut appliquer un thème visuel dynamique (couleurs, typographie, fonds, icônes) correspondant à la faction consultée *(Phase 2)*
- FR28: L'app peut afficher les figurines sous forme de cartes animées avec effets parallaxe et brillance *(Phase 2)*
- FR29: L'app peut différencier visuellement les cartes par type d'unité (cadre doré Epic Heroes, argenté Battleline) *(Phase 2)*
- FR30: L'app peut afficher les images de figurines sourcées depuis Wahapedia *(Phase 2)*
- FR31: L'app peut sauvegarder les données utilisateur (collection, listes) en localStorage
- FR32: Le joueur peut exporter ses données utilisateur en fichier JSON
- FR33: Le joueur peut importer des données utilisateur depuis un fichier JSON
- FR34: L'app peut fonctionner entièrement offline après le premier chargement
- FR35: Le joueur peut naviguer via une barre de navigation à 4 onglets (Collection, Mes Listes, Catalogue, Profil)
- FR36: Le joueur peut atteindre n'importe quelle information en maximum 2 niveaux de navigation
- FR37: Le joueur peut commencer à utiliser l'app sans onboarding ni création de compte
- FR38: L'app peut afficher des éléments personnalisés pour Pierre (splash screen, easter eggs) *(Phase 2)*

### NonFunctional Requirements

- NFR1: Chargement initial < 3 secondes sur connexion mobile 4G
- NFR2: Navigation entre fiches d'unités < 200ms (transition fluide)
- NFR3: Calcul de points dans l'army builder < 50ms à l'ajout/retrait d'une unité
- NFR4: Recherche/filtre dans la collection < 100ms, même avec 200+ unités
- NFR5: Animations CSS (parallaxe, brillance) à 60fps sur smartphone milieu de gamme (2022+)
- NFR6: Bundle applicatif < 2 Mo (hors données JSON de jeu)
- NFR7: Fonctionnement à 100% sans connexion internet après le premier chargement
- NFR8: Données utilisateur (localStorage) jamais corrompues par un crash ou fermeture brutale
- NFR9: Import JSON valide l'intégrité des données avant d'écraser les données existantes
- NFR10: Service worker sert la version correcte des données correspondant au dernier build déployé
- NFR11: Pipeline Wahapedia CSV → JSON exécuté en < 2 minutes pour toutes les factions
- NFR12: Messages d'erreur clairs si un fichier CSV a un format inattendu
- NFR13: Mise à jour complète des données (pipeline + build + déploiement) réalisable en < 15 minutes
- NFR14: Code structuré pour permettre l'ajout de fonctionnalités (V1.5, V2) sans refonte architecturale
- NFR15: Chrome Mobile 90+ et Safari iOS 15+
- NFR16: Écrans de 360px à 428px de large (smartphones standards)
- NFR17: Zones interactives minimum 44x44px pour utilisation tactile

### Additional Requirements

- Starter template : `npm create vite@latest pierrehammer -- --template react-ts` + installation Tailwind CSS v4, Motion, React Router v7, Zustand 5, vite-plugin-pwa
- Pipeline CLI Node.js séparé dans `pipeline/` (hors bundle app) avec package.json propre
- JSON par faction (lazy loading) — `factions.json` index léger + un fichier `{faction-id}.json` par faction
- Zustand 5 avec middleware `persist` — 3 stores séparés (collectionStore, listsStore, preferencesStore) + gameDataStore pour le cache
- React Router v7 mode SPA — 4 routes principales (Collection, Lists, Catalog, Profile) + sous-routes
- CSS custom properties + attribut `data-faction` sur `<html>` pour le système de theming multi-faction
- Code splitting par route (React.lazy + Suspense) pour le bundle < 2 Mo
- Alias `@/` → `src/` dans tsconfig.json et vite.config.ts
- Tests co-localisés (`.test.tsx` à côté du composant) avec Vitest + React Testing Library
- Déploiement Vercel (auto-deploy GitHub, tier hobby gratuit)
- vite-plugin-pwa avec stratégie cache-first pour app shell et données de jeu

### UX Design Requirements

- UX-DR1: Système de design tokens CSS — 11 tokens sémantiques (bg, surface, primary, accent, text, text-muted, success, warning, error, card-epic, card-battleline)
- UX-DR2: 6 palettes de faction avec couleurs et polices distinctes (Space Marines/Cinzel, Orks/Black Ops One, Aeldari/Quicksand, Necrons/Orbitron, Chaos, Tyranides)
- UX-DR3: Système typographique double police — display (variable par faction) + body (Inter) + mono (JetBrains Mono) avec échelle 1.25 Major Third
- UX-DR4: Système d'espacement 4px — 6 tokens (space-1 à space-8)
- UX-DR5: Composant `BottomNav` — 4 onglets, 56px + safe area, états actif/inactif, `role="tablist"`
- UX-DR6: Composant `UnitCard` — carte miniature avec image, nom, points, statut peinture, badge possession. 3 variantes (standard/battleline/epic hero). Tap → UnitSheet
- UX-DR7: Composant `UnitSheet` — fiche fusionnée scrollable, 8 sections ordonnées (header → actions → profil → armes tir → armes mêlée → capacités → mots-clés → options), zéro accordéon
- UX-DR8: Composant `StatusBadge` — 4 états de peinture (○ Non montée, ◐ Montée, ◑ En cours, ● Terminée), tap-to-cycle, icône + label en fiche, dot seul en grille
- UX-DR9: Composant `PointsCounter` — current/limit, 3 états couleur (ok/warning >90%/error >100%), sticky, JetBrains Mono 20px, `aria-live="polite"`
- UX-DR10: Composant `CollectionToggle` — segmented control 2 options, fond primary actif
- UX-DR11: Composant `FactionSelector` — sélection faction avec preview du skin, premier lancement + profil + création liste
- UX-DR12: Composant `ArmyListHeader` — header sticky 48px, nom + faction + détachement + PointsCounter
- UX-DR13: Composant `ArmyListRow` — vignette 44x44, nom, keywords, points. Non possédé = opacité 0.5 + bordure warning + badge ⚠. Swipe gauche → retirer
- UX-DR14: Composant `SearchBar` — filtrage temps réel < 100ms sur nom et mots-clés
- UX-DR15: Composant `ProgressBar` — barre de progression collection. 2 variantes : simple et segmentée (4 statuts)
- UX-DR16: Composant `AnimatedCard` (Phase 2) — parallaxe toucher/gyroscope, brillance CSS, cadres doré/argenté. Code existant de Thomas. `prefers-reduced-motion`
- UX-DR17: Composant `PartySwiper` (Phase 2) — swipe horizontal entre fiches, indicateur position, boutons ← →, texte 20-28px
- UX-DR18: Hiérarchie de boutons 4 niveaux — primary/secondary/ghost/danger. Max 1 primary par écran
- UX-DR19: Patterns d'états vides — message bienveillant + action CTA pour chaque vue (collection, listes, résultats, aucune liste)
- UX-DR20: Système de toast notifications — éphémère 3s pour succès, persistant avec bouton pour erreurs
- UX-DR21: Patterns de feedback inline — changement visuel immédiat (statut peinture), pulse animation (compteur points), changement couleur (dépassement)
- UX-DR22: Accessibilité WCAG AA — contraste 4.5:1, `prefers-reduced-motion`, `focus-visible`, HTML sémantique, `aria-live`, skip link
- UX-DR23: Responsive 4 breakpoints — 2 colonnes mobile (360px), 3 colonnes sm (640px), 3-4 md (768px), 4-6 lg/xl (1024-1280px)
- UX-DR24: Dark mode exclusif — fond `#0f0f1a`, pas de light mode
- UX-DR25: Patterns de navigation — bottom tab, push slide-in, back avec restauration d'état, toggle inline, mode partie overlay plein écran

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Script CLI télécharge CSV et transforme en JSON |
| FR2 | Epic 2 | Parser les fichiers CSV Wahapedia et les lier |
| FR3 | Epic 2 | Détecter les mises à jour via Last_update.csv |
| FR4 | Epic 2 | Afficher la date de dernière mise à jour |
| FR5 | Epic 2 | Fonctionner avec JSON intégrés au build |
| FR6 | Epic 4 | Marquer une unité comme possédée + quantité |
| FR7 | Epic 4 | Statut de progression peinture |
| FR8 | Epic 4 | Toggle "ma collection" / "tout le catalogue" |
| FR9 | Epic 4 | Barre de progression collection |
| FR10 | Epic 4 | Filtrer/rechercher dans la collection |
| FR11 | Epic 5 | Créer, nommer, sauvegarder, supprimer des listes |
| FR12 | Epic 5 | Sélectionner faction et détachement |
| FR13 | Epic 5 | Ajouter/retirer des unités d'une liste |
| FR14 | Epic 5 | Total de points mis à jour en temps réel |
| FR15 | Epic 5 | Alerte dépassement limite de points |
| FR16 | Epic 5 | Distinguer unités possédées/non possédées |
| FR17 | Epic 5 | Gérer plusieurs listes simultanément |
| FR18 | Epic 9 | Validation composition avancée *(Phase 2)* |
| FR19 | Epic 3 | Fiche complète d'unité scrollable |
| FR20 | Epic 4 | Fiche affiche possession et statut peinture |
| FR21 | Epic 5 | Ajouter à une liste depuis la fiche |
| FR22 | Epic 3 | Parcourir les unités par faction |
| FR23 | Epic 3 | Rechercher par nom ou mot-clé |
| FR24 | Epic 7 | Mode partie — unités de la liste active |
| FR25 | Epic 9 | Swipe horizontal entre fiches *(Phase 2)* |
| FR26 | Epic 9 | Texte agrandi lisible à distance *(Phase 2)* |
| FR27 | Epic 8 | Thème visuel dynamique par faction *(Phase 2)* |
| FR28 | Epic 8 | Cartes animées parallaxe et brillance *(Phase 2)* |
| FR29 | Epic 8 | Cadres différenciés par type d'unité *(Phase 2)* |
| FR30 | Epic 8 | Images figurines depuis Wahapedia *(Phase 2)* |
| FR31 | Epic 6 | Sauvegarde localStorage |
| FR32 | Epic 6 | Export données en JSON |
| FR33 | Epic 6 | Import données depuis JSON |
| FR34 | Epic 6 | Fonctionnement 100% offline |
| FR35 | Epic 1 | Navigation bottom nav 4 onglets |
| FR36 | Epic 1 | Max 2 niveaux de navigation |
| FR37 | Epic 1 | Zéro onboarding, usage immédiat |
| FR38 | Epic 9 | Éléments personnalisés Pierre *(Phase 2)* |

## Epic List

### Epic 1 : Fondations de l'Application
Le joueur peut naviguer dans une app responsive, accessible, en dark mode, avec une barre de navigation à 4 onglets et un accès immédiat sans onboarding.
**FRs couverts :** FR35, FR36, FR37
**NFRs associés :** NFR1, NFR6, NFR14, NFR15, NFR16, NFR17
**UX-DRs associés :** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR18, UX-DR19, UX-DR20, UX-DR21, UX-DR22, UX-DR23, UX-DR24, UX-DR25
**Exigences techniques :** Starter template Vite + React-TS, Tailwind CSS v4, React Router v7, Zustand 5, code splitting, alias @/, tests co-localisés

### Epic 2 : Pipeline de Données Wahapedia
Thomas peut exécuter un script CLI qui télécharge les CSV Wahapedia, les transforme en JSON optimisé par faction, et détecte les mises à jour. L'app affiche la date de fraîcheur des données.
**FRs couverts :** FR1, FR2, FR3, FR4, FR5
**NFRs associés :** NFR11, NFR12, NFR13
**Exigences techniques :** Pipeline CLI Node.js séparé dans `pipeline/`, JSON par faction (lazy loading), `factions.json` index + `{faction-id}.json`

### Epic 3 : Catalogue & Fiches d'Unités
Le joueur peut parcourir les unités par faction, rechercher par nom ou mot-clé, et consulter une fiche complète scrollable (stats, équipement, capacités, mots-clés, points) — zéro accordéon.
**FRs couverts :** FR19, FR22, FR23
**NFRs associés :** NFR2, NFR4
**UX-DRs associés :** UX-DR6, UX-DR7, UX-DR8, UX-DR11, UX-DR14

### Epic 4 : Gestion de Collection
Le joueur peut marquer des unités comme possédées, définir la quantité, attribuer un statut de peinture (non montée → terminée), basculer entre "ma collection" et "tout le catalogue", voir sa barre de progression, et filtrer/rechercher. La fiche d'unité affiche le statut de possession.
**FRs couverts :** FR6, FR7, FR8, FR9, FR10, FR20
**UX-DRs associés :** UX-DR8, UX-DR10, UX-DR15

### Epic 5 : Constructeur de Listes d'Armée
Le joueur peut créer, nommer, sauvegarder et supprimer des listes, sélectionner faction et détachement, ajouter/retirer des unités, voir le total de points en temps réel, recevoir une alerte de dépassement, distinguer unités possédées/non possédées, gérer plusieurs listes, et ajouter une unité depuis sa fiche.
**FRs couverts :** FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR21
**NFRs associés :** NFR3
**UX-DRs associés :** UX-DR9, UX-DR11, UX-DR12, UX-DR13

### Epic 6 : Persistance, Export & Mode Offline
Les données utilisateur sont sauvegardées en localStorage, exportables/importables en JSON avec validation d'intégrité, et l'app fonctionne entièrement offline après le premier chargement via service worker.
**FRs couverts :** FR31, FR32, FR33, FR34
**NFRs associés :** NFR7, NFR8, NFR9, NFR10
**Exigences techniques :** Zustand persist middleware, vite-plugin-pwa cache-first, déploiement Vercel

### Epic 7 : Mode Partie
Le joueur peut activer un mode partie qui affiche uniquement les unités de la liste active pour une consultation rapide en jeu.
**FRs couverts :** FR24

### Epic 8 : Expérience Visuelle Immersive *(Phase 2)*
L'app applique un thème dynamique par faction (couleurs, typographie, fonds, icônes), affiche des cartes animées avec effets parallaxe et brillance, différencie visuellement les types d'unité (cadres dorés Epic Heroes, argentés Battleline), et source les images depuis Wahapedia.
**FRs couverts :** FR27, FR28, FR29, FR30
**NFRs associés :** NFR5
**UX-DRs associés :** UX-DR16
**Exigences techniques :** CSS custom properties + data-faction, Motion, code existant de Thomas pour AnimatedCard

### Epic 9 : Mode Partie Avancé, Validation & Touches Personnelles *(Phase 2)*
Le joueur peut naviguer entre fiches par swipe horizontal, consulter en texte agrandi lisible à distance de bras, bénéficier d'une validation de composition avancée (max 6 BATTLELINE, max 3 Enhancements, Epic Heroes uniques), et découvrir des éléments personnalisés pour Pierre (splash screen, easter eggs).
**FRs couverts :** FR18, FR25, FR26, FR38
**UX-DRs associés :** UX-DR17

---

## Epic 1 : Fondations de l'Application

### Story 1.1 : Scaffolding du projet et configuration de développement

As a **développeur (Thomas)**,
I want **un projet Vite + React-TS configuré avec toutes les dépendances et conventions**,
So that **je puisse commencer à développer les fonctionnalités sur une base solide**.

**Acceptance Criteria:**

**Given** un environnement Node.js installé
**When** Thomas exécute les commandes d'initialisation
**Then** le projet est créé avec Vite 8, React 19, TypeScript 5
**And** Tailwind CSS v4 est configuré avec le plugin `@tailwindcss/vite`
**And** Motion, React Router 7, Zustand 5 et vite-plugin-pwa sont installés
**And** l'alias `@/` → `src/` est configuré dans tsconfig.json et vite.config.ts
**And** Vitest + React Testing Library sont configurés avec tests co-localisés
**And** `npm run dev` démarre l'app sans erreur

### Story 1.2 : Design System — Tokens CSS, typographie, espacement & dark mode

As a **joueur**,
I want **une interface cohérente avec un thème sombre immersif**,
So that **l'app ait une identité visuelle forte dès le premier contact**.

**Acceptance Criteria:**

**Given** le projet initialisé (Story 1.1)
**When** les tokens CSS sont définis
**Then** 11 tokens sémantiques sont disponibles (bg, surface, primary, accent, text, text-muted, success, warning, error, card-epic, card-battleline)
**And** le fond par défaut est `#0f0f1a` (dark mode exclusif, pas de light mode)
**And** 6 palettes de faction sont définies en CSS custom properties (Space Marines/Cinzel, Orks/Black Ops One, Aeldari/Quicksand, Necrons/Orbitron, Chaos, Tyranides)
**And** le système typographique double police est en place (display variable + Inter body + JetBrains Mono mono, échelle 1.25)
**And** les tokens d'espacement 4px (space-1 à space-8) sont définis
**And** l'attribut `data-faction` sur `<html>` permet de switcher les palettes

### Story 1.3 : App Shell — Routing, Navigation & Layout

As a **joueur**,
I want **naviguer entre les 4 sections principales via une barre en bas de l'écran**,
So that **j'accède rapidement à toutes les fonctionnalités en maximum 2 taps**.

**Acceptance Criteria:**

**Given** l'app est chargée
**When** le joueur arrive sur l'app
**Then** il voit le contenu directement sans onboarding ni création de compte (FR37)
**And** une BottomNav avec 4 onglets (Collection, Mes Listes, Catalogue, Profil) est affichée en bas (FR35)
**And** la BottomNav fait 56px + safe area, avec `role="tablist"` et états actif/inactif
**And** chaque onglet charge sa route via React Router v7 en mode SPA
**And** le code splitting (React.lazy + Suspense) charge chaque route à la demande
**And** toute information est accessible en maximum 2 niveaux de navigation (FR36)
**And** les transitions entre routes utilisent un pattern push slide-in

### Story 1.4 : Composants UI fondamentaux

As a **joueur**,
I want **des interactions visuelles claires et cohérentes (boutons, recherche, notifications, états vides)**,
So that **je comprenne toujours ce qui se passe et quoi faire ensuite**.

**Acceptance Criteria:**

**Given** le design system est en place (Story 1.2)
**When** les composants partagés sont implémentés
**Then** la hiérarchie de boutons 4 niveaux (primary/secondary/ghost/danger) est disponible, max 1 primary par écran
**And** le composant SearchBar est disponible avec filtrage < 100ms sur nom et mots-clés
**And** le système de toast notifications fonctionne (éphémère 3s succès, persistant avec bouton pour erreurs)
**And** les patterns d'états vides sont implémentés (message bienveillant + CTA pour chaque vue)
**And** les patterns de feedback inline sont en place (changement visuel immédiat, pulse animation, changement couleur)

### Story 1.5 : Responsive & Accessibilité

As a **joueur sur smartphone**,
I want **une app utilisable sur mon écran (360–428px) avec des zones tactiles confortables**,
So that **je puisse naviguer sans difficulté, même avec de gros doigts**.

**Acceptance Criteria:**

**Given** l'app shell et les composants sont en place
**When** le joueur utilise l'app sur différents appareils
**Then** le layout s'adapte sur 4 breakpoints (360px 2 colonnes, 640px 3 colonnes, 768px 3-4 colonnes, 1024-1280px 4-6 colonnes)
**And** toutes les zones interactives font minimum 44x44px
**And** le contraste respecte WCAG AA (4.5:1 minimum)
**And** `prefers-reduced-motion` désactive les animations
**And** `focus-visible` est stylé pour la navigation clavier
**And** les éléments dynamiques utilisent `aria-live` approprié
**And** un skip link est présent
**And** le HTML est sémantique
**And** l'app est compatible Chrome Mobile 90+ et Safari iOS 15+

---

## Epic 2 : Pipeline de Données Wahapedia

### Story 2.1 : Scaffolding du pipeline CLI et téléchargement des CSV

As a **développeur (Thomas)**,
I want **un script CLI Node.js qui télécharge tous les fichiers CSV depuis Wahapedia**,
So that **je dispose des données brutes pour les transformer**.

**Acceptance Criteria:**

**Given** le dossier `pipeline/` avec son propre package.json
**When** Thomas exécute `npm run download` dans `pipeline/`
**Then** tous les CSV Wahapedia nécessaires sont téléchargés (Factions, Datasheets, Abilities, Keywords, Models, Wargear, Points, Last_update)
**And** les fichiers sont stockés dans `pipeline/data/raw/`
**And** un message d'erreur clair est affiché si un fichier CSV a un format inattendu ou si le téléchargement échoue (NFR12)
**And** le script affiche la progression du téléchargement

### Story 2.2 : Parsing des CSV et liaison par identifiants

As a **développeur (Thomas)**,
I want **que les CSV soient parsés et liés entre eux par identifiants**,
So that **les données forment un modèle cohérent exploitable par l'app**.

**Acceptance Criteria:**

**Given** les fichiers CSV bruts téléchargés (Story 2.1)
**When** Thomas exécute `npm run parse` dans `pipeline/`
**Then** les fichiers Factions, Datasheets, Abilities, Keywords, Models, Wargear et Points sont parsés (FR2)
**And** les datasheets sont liées à leur faction, abilities, keywords, models, wargear et points par identifiants
**And** les données invalides ou manquantes sont signalées avec des messages d'erreur clairs (NFR12)
**And** le parsing complet s'exécute en moins de 2 minutes pour toutes les factions (NFR11)

### Story 2.3 : Génération des JSON optimisés par faction

As a **développeur (Thomas)**,
I want **que les données parsées soient exportées en JSON optimisé — un fichier index + un fichier par faction**,
So that **l'app puisse charger les données par faction en lazy loading**.

**Acceptance Criteria:**

**Given** les données parsées et liées (Story 2.2)
**When** Thomas exécute `npm run generate` dans `pipeline/`
**Then** un fichier `factions.json` index léger est généré (liste des factions avec id, nom, nombre d'unités)
**And** un fichier `{faction-id}.json` est généré par faction avec toutes les datasheets, abilities, keywords, wargear et points
**And** les JSON sont écrits dans `public/data/` (intégrés au build, FR5)
**And** la date de dernière mise à jour de `Last_update.csv` est incluse dans `factions.json` (FR3, FR4)
**And** un script unique `npm run pipeline` enchaîne download → parse → generate

### Story 2.4 : Détection de mise à jour et commande unifiée

As a **développeur (Thomas)**,
I want **détecter si les données Wahapedia ont changé avant de relancer le pipeline complet**,
So that **je ne relance le traitement que quand c'est nécessaire et que la mise à jour complète prend < 15 minutes**.

**Acceptance Criteria:**

**Given** des JSON déjà générés d'une exécution précédente
**When** Thomas exécute `npm run check-update` dans `pipeline/`
**Then** le script compare la date de `Last_update.csv` distante avec celle stockée localement (FR3)
**And** si les données sont à jour, un message le confirme et le pipeline ne se relance pas
**And** si les données ont changé, le pipeline complet est relancé automatiquement
**And** la mise à jour complète (pipeline + build) est réalisable en < 15 minutes (NFR13)

---

## Epic 3 : Catalogue & Fiches d'Unités

### Story 3.1 : Chargement des données de jeu et sélection de faction

As a **joueur**,
I want **choisir une faction et voir ses unités se charger**,
So that **je puisse explorer le catalogue de ma faction**.

**Acceptance Criteria:**

**Given** les JSON de données sont intégrés au build (Epic 2)
**When** le joueur accède à l'onglet Catalogue
**Then** le gameDataStore charge `factions.json` (index léger)
**And** un FactionSelector affiche les factions disponibles avec preview du skin
**And** quand le joueur sélectionne une faction, le JSON `{faction-id}.json` est chargé en lazy loading
**And** l'attribut `data-faction` sur `<html>` est mis à jour pour appliquer la palette de la faction
**And** la date de dernière mise à jour des données est visible (FR4)

### Story 3.2 : Grille d'unités avec UnitCard

As a **joueur**,
I want **voir toutes les unités de ma faction sous forme de cartes**,
So that **je puisse rapidement identifier les unités qui m'intéressent**.

**Acceptance Criteria:**

**Given** une faction sélectionnée et ses données chargées
**When** le joueur voit la grille d'unités
**Then** chaque unité est affichée dans un composant UnitCard (nom, points, type)
**And** les UnitCards ont 3 variantes visuelles : standard, battleline (cadre identifié), epic hero (cadre identifié)
**And** la grille est responsive (2 colonnes sur 360px, 3 sur 640px, etc.)
**And** un tap sur une UnitCard navigue vers la fiche complète (UnitSheet)

### Story 3.3 : Fiche d'unité complète (UnitSheet)

As a **joueur**,
I want **consulter toutes les informations d'une unité sur une seule vue scrollable**,
So that **je n'aie pas besoin de chercher dans des accordéons ou des sous-menus**.

**Acceptance Criteria:**

**Given** le joueur tape sur une UnitCard
**When** la fiche UnitSheet s'affiche
**Then** elle contient 8 sections ordonnées : header → actions → profil de caractéristiques → armes de tir → armes de mêlée → capacités → mots-clés → options (UX-DR7)
**And** aucun accordéon n'est utilisé — tout est visible en scrollant (FR19)
**And** la navigation vers la fiche se fait en transition slide-in < 200ms (NFR2)
**And** un bouton retour ramène à la grille avec restauration de la position de scroll
**And** le StatusBadge affiche le statut de peinture avec ses 4 états visuels (○ ◐ ◑ ●) (UX-DR8)

### Story 3.4 : Recherche et filtrage dans le catalogue

As a **joueur**,
I want **rechercher une unité par nom ou mot-clé dans le catalogue**,
So that **je trouve rapidement ce que je cherche sans parcourir toute la liste**.

**Acceptance Criteria:**

**Given** une faction sélectionnée avec ses unités affichées
**When** le joueur tape dans la SearchBar
**Then** les résultats se filtrent en temps réel < 100ms (NFR4, UX-DR14)
**And** la recherche fonctionne sur le nom de l'unité et les mots-clés
**And** si aucun résultat ne correspond, un état vide avec message bienveillant est affiché
**And** la recherche fonctionne même avec 200+ unités sans ralentissement

---

## Epic 4 : Gestion de Collection

### Story 4.1 : Marquage de possession et quantité

As a **joueur**,
I want **marquer une unité comme possédée et définir combien j'en ai**,
So that **l'app sache ce que j'ai dans ma vitrine**.

**Acceptance Criteria:**

**Given** le joueur consulte une UnitCard ou une UnitSheet
**When** il marque une unité comme possédée
**Then** un badge de possession apparaît sur la UnitCard
**And** il peut définir la quantité possédée (1, 2, 3…)
**And** la donnée est stockée dans le collectionStore (Zustand)
**And** la fiche d'unité (UnitSheet) affiche le nombre de figurines possédées (FR20)
**And** il peut retirer une unité de sa collection

### Story 4.2 : Statut de progression peinture

As a **joueur/peintre**,
I want **attribuer un statut de peinture à chaque figurine possédée**,
So that **je suive ma progression dans le hobby**.

**Acceptance Criteria:**

**Given** une unité marquée comme possédée
**When** le joueur interagit avec le StatusBadge
**Then** il peut cycler entre les 4 statuts : Non montée (○) → Montée (◐) → En cours (◑) → Terminée (●) (FR7, UX-DR8)
**And** le changement est visuel et immédiat (tap-to-cycle)
**And** en grille, seul le dot de couleur est affiché ; en fiche, l'icône + le label sont affichés
**And** la fiche d'unité affiche le statut de peinture (FR20)
**And** le statut est persisté dans le collectionStore

### Story 4.3 : Toggle Collection / Catalogue et filtrage

As a **joueur**,
I want **basculer entre "ma collection" et "tout le catalogue" et filtrer par faction, statut ou nom**,
So that **je retrouve rapidement ce que je cherche dans mes figurines**.

**Acceptance Criteria:**

**Given** le joueur est dans l'onglet Collection
**When** il utilise le CollectionToggle (segmented control 2 options)
**Then** il bascule entre l'affichage "ma collection" (unités possédées uniquement) et "tout le catalogue" (FR8, UX-DR10)
**And** le fond primary indique l'option active
**And** il peut filtrer par faction, mot-clé, statut de peinture ou nom d'unité (FR10)
**And** le filtrage se fait en temps réel < 100ms, même avec 200+ unités (NFR4)
**And** si aucun résultat, un état vide avec CTA est affiché

### Story 4.4 : Barre de progression de la collection

As a **joueur**,
I want **voir une barre de progression de ma collection**,
So that **je mesure visuellement où j'en suis dans mon hobby**.

**Acceptance Criteria:**

**Given** le joueur a des unités dans sa collection
**When** il consulte la vue Collection
**Then** une ProgressBar affiche le pourcentage global de progression (FR9)
**And** la variante segmentée montre la répartition par statut (non montée, montée, en cours, terminée) avec couleurs distinctes (UX-DR15)
**And** la barre se met à jour en temps réel quand un statut change
**And** si la collection est vide, un état vide bienveillant avec CTA "Ajouter ma première figurine" est affiché

---

## Epic 5 : Constructeur de Listes d'Armée

### Story 5.1 : Création, nommage et suppression de listes

As a **joueur**,
I want **créer, nommer et supprimer des listes d'armée**,
So that **je prépare mes différentes configurations avant une partie**.

**Acceptance Criteria:**

**Given** le joueur accède à l'onglet Mes Listes
**When** il crée une nouvelle liste
**Then** il peut lui donner un nom personnalisé (FR11)
**And** il sélectionne une faction via le FactionSelector (FR12, UX-DR11)
**And** il sélectionne un détachement parmi ceux disponibles pour la faction (FR12)
**And** il choisit une limite de points (1000 / 2000 / 3000)
**And** la liste est sauvegardée dans le listsStore (Zustand)
**And** il peut supprimer une liste existante avec confirmation (bouton danger)
**And** il peut gérer plusieurs listes simultanément (FR17)
**And** si aucune liste n'existe, un état vide avec CTA "Créer ma première liste" est affiché

### Story 5.2 : Header de liste et compteur de points

As a **joueur**,
I want **voir en permanence le nom, la faction, le détachement et le total de points de ma liste**,
So that **je sache toujours où j'en suis pendant la construction**.

**Acceptance Criteria:**

**Given** une liste d'armée ouverte
**When** le joueur consulte la liste
**Then** un ArmyListHeader sticky (48px) affiche le nom, la faction, le détachement et le PointsCounter (UX-DR12)
**And** le PointsCounter affiche current/limit en JetBrains Mono 20px (UX-DR9)
**And** le compteur est vert quand ok, orange warning quand > 90% de la limite, rouge error quand > 100% (FR15)
**And** le compteur utilise `aria-live="polite"` pour l'accessibilité
**And** le header reste visible pendant le scroll

### Story 5.3 : Ajout et retrait d'unités dans une liste

As a **joueur**,
I want **ajouter et retirer des unités de ma liste**,
So that **je compose l'armée que je veux aligner**.

**Acceptance Criteria:**

**Given** une liste d'armée ouverte avec une faction sélectionnée
**When** le joueur parcourt les unités de la faction
**Then** il peut ajouter une unité à la liste (FR13)
**And** il peut aussi ajouter une unité directement depuis sa fiche UnitSheet (FR21)
**And** le total de points se met à jour en temps réel < 50ms (FR14, NFR3)
**And** le PointsCounter pulse brièvement à chaque modification
**And** chaque unité ajoutée apparaît comme une ArmyListRow (vignette 44x44, nom, keywords, points) (UX-DR13)
**And** un swipe gauche sur une ArmyListRow retire l'unité de la liste
**And** une alerte visuelle apparaît si la liste dépasse la limite de points (FR15)

### Story 5.4 : Distinction visuelle possession dans la liste

As a **joueur**,
I want **distinguer visuellement les unités que je possède de celles que je ne possède pas dans ma liste**,
So that **je sache ce qu'il me manque pour jouer cette liste**.

**Acceptance Criteria:**

**Given** une liste contenant des unités possédées et non possédées
**When** le joueur consulte sa liste
**Then** les unités non possédées sont affichées avec opacité 0.5, bordure warning et badge ⚠ (FR16, UX-DR13)
**And** les unités possédées sont affichées normalement
**And** le statut de possession est lu depuis le collectionStore
**And** si le joueur ajoute l'unité à sa collection, l'affichage se met à jour immédiatement

### Story 5.5 : Édition et renommage de liste

As a **joueur**,
I want **modifier le nom, la faction, le détachement ou la limite de points d'une liste existante**,
So that **je puisse ajuster ma liste sans la recréer de zéro**.

**Acceptance Criteria:**

**Given** une liste d'armée existante
**When** le joueur édite les paramètres de la liste
**Then** il peut renommer la liste
**And** il peut changer le détachement (dans la même faction)
**And** il peut changer la limite de points (1000 / 2000 / 3000)
**And** le PointsCounter et les alertes se recalculent immédiatement
**And** les modifications sont persistées dans le listsStore

---

## Epic 6 : Persistance, Export & Mode Offline

### Story 6.1 : Persistance localStorage avec Zustand persist

As a **joueur**,
I want **que mes données (collection, listes, préférences) soient automatiquement sauvegardées**,
So that **je ne perde rien quand je ferme l'app ou que mon téléphone plante**.

**Acceptance Criteria:**

**Given** le joueur utilise l'app normalement
**When** il modifie sa collection, ses listes ou ses préférences
**Then** les 3 stores Zustand (collectionStore, listsStore, preferencesStore) persistent automatiquement en localStorage via le middleware `persist` (FR31)
**And** les données ne sont jamais corrompues par un crash ou une fermeture brutale (NFR8)
**And** au rechargement de l'app, toutes les données sont restaurées à l'identique
**And** chaque store utilise une clé distincte (`pierrehammer-collection`, `pierrehammer-lists`, `pierrehammer-preferences`)

### Story 6.2 : Export et import des données utilisateur

As a **joueur**,
I want **exporter mes données en fichier JSON et les réimporter**,
So that **je puisse sauvegarder mes données, les transférer sur un autre appareil, ou les restaurer**.

**Acceptance Criteria:**

**Given** le joueur accède à la section Profil
**When** il appuie sur "Exporter mes données"
**Then** un fichier JSON contenant collection, listes et préférences est téléchargé (FR32)

**Given** le joueur a un fichier JSON exporté
**When** il appuie sur "Importer mes données" et sélectionne le fichier
**Then** l'intégrité des données est validée avant import (NFR9)
**And** si les données sont valides, elles remplacent les données existantes (FR33)
**And** si les données sont invalides, un message d'erreur clair est affiché et les données existantes ne sont pas modifiées
**And** un toast de confirmation s'affiche après un import réussi

### Story 6.3 : Mode offline avec Service Worker (PWA)

As a **joueur**,
I want **utiliser l'app entièrement sans connexion internet après le premier chargement**,
So that **je puisse consulter mes listes et ma collection même sans réseau (en tournoi, en magasin)**.

**Acceptance Criteria:**

**Given** le joueur a chargé l'app au moins une fois avec connexion
**When** il ouvre l'app sans connexion internet
**Then** l'app fonctionne à 100% : navigation, consultation, modification (FR34, NFR7)
**And** vite-plugin-pwa met en cache l'app shell et les données de jeu avec stratégie cache-first
**And** le service worker sert la version correcte des données correspondant au dernier build (NFR10)
**And** l'app est installable comme PWA sur l'écran d'accueil
**And** le chargement initial est < 3 secondes sur 4G (NFR1)
**And** le bundle applicatif est < 2 Mo hors données JSON (NFR6)

---

## Epic 7 : Mode Partie

### Story 7.1 : Activation du mode partie et sélection de liste

As a **joueur en partie**,
I want **activer un mode partie en choisissant ma liste active**,
So that **je ne voie que les unités que j'aligne sur la table**.

**Acceptance Criteria:**

**Given** le joueur a au moins une liste d'armée sauvegardée
**When** il active le mode partie
**Then** il sélectionne la liste à utiliser parmi ses listes existantes
**And** le mode partie s'affiche en overlay plein écran (UX-DR25)
**And** seules les unités de la liste sélectionnée sont affichées (FR24)
**And** le joueur peut quitter le mode partie à tout moment pour revenir à la navigation normale
**And** si aucune liste n'existe, un message guide le joueur vers la création de liste

### Story 7.2 : Consultation des fiches en mode partie

As a **joueur en partie**,
I want **consulter les fiches de mes unités rapidement pendant le jeu**,
So that **je vérifie mes stats sans perdre de temps**.

**Acceptance Criteria:**

**Given** le mode partie est activé avec une liste
**When** le joueur tape sur une unité de la liste
**Then** la fiche UnitSheet s'affiche avec toutes les informations (stats, armes, capacités)
**And** la navigation retour ramène à la liste du mode partie (pas à la navigation principale)
**And** les transitions sont fluides < 200ms (NFR2)
**And** le header du mode partie reste visible pour rappeler la liste active

---

## Epic 8 : Expérience Visuelle Immersive *(Phase 2)*

### Story 8.1 : Thème visuel dynamique par faction

As a **joueur**,
I want **que l'app change d'ambiance visuelle selon la faction consultée**,
So that **je sois immergé dans l'univers de ma faction**.

**Acceptance Criteria:**

**Given** les palettes de faction sont définies en CSS custom properties (Epic 1)
**When** le joueur navigue vers une faction
**Then** les couleurs, la typographie display et les fonds d'ambiance s'adaptent dynamiquement à la faction (FR27)
**And** les 6 factions ont chacune leur identité visuelle complète (Space Marines/Cinzel, Orks/Black Ops One, Aeldari/Quicksand, Necrons/Orbitron, Chaos, Tyranides)
**And** la transition entre factions est fluide
**And** l'attribut `data-faction` sur `<html>` pilote le changement de thème

### Story 8.2 : Cartes animées avec parallaxe et brillance (AnimatedCard)

As a **joueur**,
I want **voir mes figurines sous forme de cartes animées avec effets visuels premium**,
So that **l'app ait un effet "wow" qui impressionne mes potes**.

**Acceptance Criteria:**

**Given** les UnitCards sont affichées dans le catalogue ou la collection
**When** le joueur interagit avec une carte (toucher/gyroscope)
**Then** un effet parallaxe réagit au mouvement (FR28, UX-DR16)
**And** un effet de brillance CSS est appliqué sur la carte
**And** les animations tournent à 60fps sur smartphone milieu de gamme 2022+ (NFR5)
**And** `prefers-reduced-motion` désactive les animations
**And** le code existant de Thomas pour l'AnimatedCard est intégré et adapté

### Story 8.3 : Cadres différenciés et images Wahapedia

As a **joueur**,
I want **distinguer visuellement les types d'unité par leur cadre et voir les images des figurines**,
So that **je repère immédiatement les Epic Heroes et les Battleline**.

**Acceptance Criteria:**

**Given** les UnitCards sont affichées
**When** le joueur parcourt les cartes
**Then** les Epic Heroes ont un cadre doré distinctif (FR29)
**And** les Battleline ont un cadre argenté distinctif (FR29)
**And** les unités standard ont un cadre neutre
**And** les images de figurines sont sourcées depuis Wahapedia et affichées sur les cartes (FR30)
**And** un placeholder est affiché si l'image n'est pas disponible
**And** les images sont mises en cache par le service worker pour l'offline

---

## Epic 9 : Mode Partie Avancé, Validation & Touches Personnelles *(Phase 2)*

### Story 9.1 : Navigation swipe et texte agrandi en mode partie (PartySwiper)

As a **joueur en partie**,
I want **swiper horizontalement entre les fiches de ma liste et les lire en gros texte**,
So that **je consulte rapidement mes unités à distance de bras sans plisser les yeux**.

**Acceptance Criteria:**

**Given** le mode partie est activé avec une liste
**When** le joueur consulte une fiche
**Then** il peut naviguer entre les fiches par swipe horizontal gauche/droite (FR25, UX-DR17)
**And** un indicateur de position montre quelle unité est affichée (ex: 3/8)
**And** des boutons ← → sont disponibles en alternative au swipe
**And** le texte est affiché en taille agrandie (20-28px) pour être lisible à distance de bras (FR26)
**And** les transitions entre fiches sont fluides

### Story 9.2 : Validation avancée de composition d'armée

As a **joueur compétitif**,
I want **que ma liste soit validée selon les règles W40K**,
So that **je sache si ma liste est légale avant d'arriver en tournoi**.

**Acceptance Criteria:**

**Given** une liste d'armée avec des unités ajoutées
**When** le joueur consulte sa liste
**Then** une alerte s'affiche si plus de 6 unités BATTLELINE ou DEDICATED TRANSPORT sont présentes (FR18)
**And** une alerte s'affiche si plus de 3 Enhancements sont attribués (FR18)
**And** une alerte s'affiche si un Epic Hero est ajouté en double (FR18)
**And** les alertes de validation sont distinctes de l'alerte de dépassement de points
**And** un résumé de validation (valide/invalide avec détails) est accessible depuis le header de liste

### Story 9.3 : Éléments personnalisés pour Pierre

As a **Pierre (destinataire du cadeau)**,
I want **découvrir des touches personnelles cachées dans l'app**,
So that **je sache que cette app a été faite spécialement pour moi**.

**Acceptance Criteria:**

**Given** Pierre utilise l'app
**When** il ouvre l'app pour la première fois
**Then** un splash screen personnalisé s'affiche (FR38)

**Given** Pierre explore l'app
**When** il découvre certaines interactions spécifiques
**Then** des easter eggs personnalisés se déclenchent (FR38)
**And** les easter eggs ne gênent pas l'utilisation normale de l'app
**And** les contenus personnalisés sont discrets mais chaleureux

---

## Epic 10 : Fondations Cloud (Supabase, Auth, Amis) *(Phase 3)*

L'app devient connectée : les joueurs peuvent créer un compte, synchroniser leurs listes en ligne, ajouter des amis et consulter leurs listes publiques. Le mode offline reste fonctionnel à 100%.

### Story 10.1 : Intégration Supabase et authentification
Setup du client Supabase, auth email/password, authStore Zustand, UI connexion/inscription dans ProfilePage. Mode invité préservé.

### Story 10.2 : Migration des army lists vers Supabase
Tables SQL pour les listes, service de synchronisation local-first, migration des listes localStorage vers Supabase à la première connexion, fallback offline.

### Story 10.3 : Système d'amis et listes partagées
Tables profiles + friendships, recherche d'utilisateurs, demandes d'ami, page Amis, consultation des listes publiques des amis, toggle public/privé sur les listes.

---

## Epic 11 : Moteur de Combat W40K *(Phase 3)*

Un moteur de simulation de combat qui calcule automatiquement les résultats statistiques (hits, wounds, saves, dégâts) à partir des données d'armes et de profils déjà en mémoire, sans aucune saisie manuelle.

### Story 11.1 : Parser de keywords d'armes
Parser le champ `Weapon.abilities` (texte brut) en données structurées `WeaponKeywords` (sustained hits, lethal hits, anti-X, melta, blast, etc.). ~46 keywords supportés.

### Story 11.2 : Mapping des abilities et règles de combat
Registre d'abilities qui mappe les noms d'abilities (Core, Faction, Datasheet) à des effets mécaniques typés (Feel No Pain, Stealth, damage reduction, etc.). Extracteur d'effets de combat pour un Datasheet complet.

### Story 11.3 : Moteur de résolution de combat W40K 10e édition
Pipeline complet : nombre d'attaques → hit roll → wound roll (table S vs T) → save roll (avec invuln) → dégâts → FnP. Application de tous les keywords d'armes et abilities.

### Story 11.4 : UI de simulation de combat (mode solo)
Interface pour simuler une attaque entre deux unités quelconques. Sélection d'arme, sélection de cible cross-faction, résultats détaillés par étape, toggles contextuels (demi-portée, charge, stationnaire).

---

## Epic 12 : Mode Partie Multijoueur *(Phase 3)*

Les joueurs peuvent démarrer une session de jeu contre un ami, voir les listes de l'autre, tracker les pertes en temps réel, et simuler des attaques contextuelles en 2 taps.

### Story 12.1 : Game sessions et sélection de l'adversaire
Créer une session de jeu en sélectionnant un ami et sa liste. Table game_sessions, gameSessionStore, affichage de la liste adverse en lecture seule.

### Story 12.2 : Tracking des pertes en temps réel
Compteurs de modèles vivants et blessures par unité, synchronisés via Supabase Realtime entre les deux joueurs. Intégration avec le moteur de combat.

### Story 12.3 : Simulation contextuelle en partie (attaque contre escouade adverse)
"Attaquer..." → sélectionner une cible adverse → résultats automatiques. Arme présélectionnée intelligemment, pertes et enhancements pris en compte. Zero config, 2 taps.

---

## Epic 13 : Polish & Règles Avancées *(Phase 4)*

Stratagèmes activables dans la simulation, profils dégradés, leaders attachés, et historique de parties.

### Story 13.1 : Stratagèmes activables dans la simulation
Activer un stratagème dans le simulateur, voir son effet en delta sur les résultats, stratagèmes défensifs adverses, filtrage par phase.

### Story 13.2 : Profils dégradés et règles avancées
Profils dégradés pour véhicules/monstres blessés, unités multi-profil, intégration du leader attaché (armes combinées).

### Story 13.3 : Historique et résumé de partie
Résumé auto-généré en fin de partie (durée, pertes, MVP), stocké en base, historique consultable depuis le profil.
