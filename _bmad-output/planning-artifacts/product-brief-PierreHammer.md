---
title: "Product Brief: PierreHammer"
status: "complete"
created: "2026-03-31"
updated: "2026-03-31"
inputs:
  - "_bmad-output/planning-artifacts/research/domain-warhammer40k-app-research-2026-03-31.md"
  - "_bmad-output/brainstorming/brainstorming-session-2026-03-31-01.md"
---

# Product Brief : PierreHammer

## Résumé exécutif

PierreHammer est une Progressive Web App (PWA) Warhammer 40K conçue comme un cadeau pour Pierre et son groupe de 5-6 joueurs. Elle réunit en un seul outil ce qu'aucune application existante ne propose : la gestion de collection avec suivi de peinture, la construction de listes d'armée avec vérification de possession, et la consultation de fiches d'unités — le tout dans une interface immersive qui change de peau selon la faction consultée.

Le projet naît d'un constat simple : aujourd'hui, les joueurs de Warhammer 40K jonglent entre 2 à 3 outils (Wahapedia pour les règles, New Recruit pour les listes, un tableur ou une app séparée pour la collection). Aucun ne les fusionne, aucun ne propose une expérience visuelle à la hauteur de l'univers W40K. PierreHammer comble ce vide avec un parti pris fort : des cartes de figurines animées, des skins dynamiques par faction, et une UX "tout visible d'un coup" pensée pour être utilisée en pleine partie, smartphone posé sur la table.

C'est une app privée, non commerciale — un cadeau entre amis, pas un produit.

## Le problème

Quand Pierre et ses amis préparent une partie de Warhammer 40K, ils vivent un parcours fragmenté :

- **Construire une liste** → New Recruit ou l'app officielle GW (payante, buggée). Aucun ne sait quelles figurines ils possèdent réellement — ils doivent vérifier manuellement.
- **Consulter les règles** → Wahapedia, qui souffre de pannes et de pressions légales de GW. L'information est dense, pas pensée pour la consultation rapide en partie.
- **Suivre leur collection** → Un tableur, une app hobby séparée, ou leur mémoire. Aucun lien avec la construction de listes.

Résultat : avant chaque partie, c'est un chassé-croisé d'onglets, de PDFs et de "attends, je vérifie si j'ai cette unité". Pendant la partie, les accordéons et sous-menus des apps existantes ralentissent le jeu.

Avec la 11ème édition qui arrive en juin 2026 (70 nouveaux détachements, multi-détachements par armée), cette fragmentation ne fera que s'aggraver.

## La solution

PierreHammer fusionne trois piliers en une seule app :

**1. Collection vivante** — Chaque figurine possédée est suivie avec 4 statuts de progression (non montée → montée → en cours de peinture → terminée). Un toggle simple permet de basculer entre "ma collection" et "tout le catalogue".

**2. Army builder** — Construction de listes avec calcul de points en temps réel et alertes de dépassement. L'app sait ce que le joueur possède et le montre visuellement — les unités non possédées sont clairement identifiées. La validation avancée des règles de composition (détachements, leaders, enhancements) est prévue en Phase 2.

**3. Fiches d'unités fusionnées** — Une seule vue scrollable par unité : stats, équipement, capacités, nombre possédé, et bouton "ajouter à ma liste". Zéro accordéon — tout est visible d'un coup, lisible en partie avec un smartphone.

## Ce qui rend PierreHammer unique

- **Skin dynamique par faction** — Couleurs, typographie, icônes et fonds changent selon la faction consultée via CSS variables. L'app se transforme visuellement dès que le joueur choisit sa faction — c'est le premier "wow" à l'ouverture et l'identité visuelle de PierreHammer.
- **Cartes de figurines animées** — Effet parallaxe et brillance CSS, cadres dorés pour les Epic Heroes, argentés pour les Battleline. L'esthétique d'une carte à collectionner premium. Images de figurines sourcées depuis Wahapedia.
- **Possession intégrée** — Aucun concurrent ne lie collection et army builder. PierreHammer est le seul outil où "construire une liste" signifie "construire avec ce que tu as".
- **Conçue pour la table** — Mode partie avec swipe entre les unités de la liste active, gros texte lisible, accessible offline grâce aux service workers. L'app fonctionne exactement là où on en a besoin, sans dépendre du WiFi du magasin ou du club.

## À qui s'adresse PierreHammer

**Pierre et ses 5-6 amis joueurs W40K**, qui couvrent naturellement les 4 profils types :

- **Le Compétiteur** — Optimise ses listes, veut des infos sur les changements de points. PierreHammer lui offre la fiche fusionnée et le calcul de points en temps réel.
- **La Collectionneuse/Peintre** — 150+ figurines, peint régulièrement. PierreHammer lui offre le suivi de progression et la galerie de sa collection avec les cartes animées.
- **Le Narratif** — Joue pour l'histoire. PierreHammer lui offre l'historique de parties (Phase 2) et l'immersion visuelle par faction.
- **Le Casual** — Joue 1x/mois, oublie les règles. PierreHammer lui offre le zéro-accordéon et le mode partie simplifié.

**Principe de design : walk-up playability** — Si le joueur le moins technique du groupe s'y retrouve sans explication, c'est gagné. Chaque décision de design est testée contre ce critère.

## Critères de succès

Pour une app-cadeau entre amis, le succès se mesure concrètement :

- **Adoption** — Au moins 3 joueurs sur 6 utilisent PierreHammer lors d'une session de jeu dans les 2 semaines suivant le lancement
- **Le "wow"** — Pierre choisit sa faction et voit l'app se transformer sous ses yeux (skin + cartes animées)
- **Autonomie** — L'app reste à jour grâce au pipeline Wahapedia CSV → JSON, déclenché manuellement après chaque mise à jour GW (MFM trimestriel). Un indicateur "dernière mise à jour des données" est visible dans l'app
- **Utilisabilité en partie** — Le mode partie est effectivement utilisé smartphone en main pendant les parties

## Architecture & données

**Approche local-first** — Les données utilisateur (collection, listes) sont stockées en localStorage avec export/import JSON. Chaque joueur gère ses données sur son appareil. Pas de backend, pas d'auth, pas de coûts d'hébergement. Simple, robuste, zéro friction.

**Pipeline de données de jeu** — Script Node.js qui récupère les CSV Wahapedia, les transforme en JSON optimisé pour l'app, et les intègre au build. Exécuté manuellement par Thomas après chaque mise à jour GW (~trimestrielle). L'app affiche la date de dernière mise à jour des données.

**Architecture pensée pour durer** — Séparation stricte entre données de jeu (Wahapedia, potentiellement volatiles) et données utilisateur (collection, listes). Structure de données flexible pour absorber la transition 10ème → 11ème édition (juin 2026). Les codex actuels restent compatibles.

## Scope — Développement en 2 phases

### Phase 1 : Fondations fonctionnelles

L'architecture, le pipeline de données, et les fonctionnalités core. L'objectif est une app utilisable de bout en bout, même sans le polish visuel final.

- Pipeline Wahapedia CSV → JSON (script CLI Node.js)
- PWA offline (service workers)
- Structure de données flexible (factions, datasheets, keywords, points)
- Fiche d'unité fusionnée (stats + collection + army builder), zéro accordéon
- Collection avec 4 statuts de progression et toggle "ma collection / tout"
- Army builder : sélection d'unités, calcul de points, alerte dépassement de limite
- Navigation : 4 onglets (Collection | Mes Listes | Catalogue | Profil), max 2 niveaux
- Stockage local-first (localStorage + export/import JSON)
- Zéro onboarding — 3 taps et c'est opérationnel

### Phase 2 : Wow factor & polish

Le visuel signature et les fonctionnalités avancées, construits sur les fondations solides de la Phase 1.

- Cartes de figurines animées (parallaxe CSS, brillance, cadres or/argent)
- Skin dynamique par faction (CSS variables : couleurs, typo, fonds, icônes)
- Mode partie (swipe entre unités de la liste active, gros texte)
- Validation avancée de composition (détachements, leaders, enhancements, Epic Heroes uniques)
- Touches personnelles (easter eggs, splash screen Pierre, inside jokes)

### Hors scope (V1.5 / V2)

- Suggestions de listes automatiques ("avec tes figurines, voici 3 listes")
- MathHammer (simulateur de combat probabiliste)
- Module méta/winrates
- Guides de peinture et conversion multi-marques
- Notifications de changements de points
- Historique des parties
- Gamification (badges, classements, récap mensuel)
- Mode Crusade / campagne narrative
- Profils amis et collections partagées

## Vision

Si PierreHammer fait mouche, l'app peut grandir naturellement :

- **V1.5** — Suggestions de listes automatiques, notifications de changements de points, historique des parties, profils amis, dashboard de progression
- **V2** — MathHammer intégré, module méta complet, guides de peinture multi-marques, gamification, mode Crusade

L'architecture dès la Phase 1 est conçue pour rendre ces évolutions possibles sans refonte.

## Stack technique

- **Front-end :** React + TypeScript + Tailwind CSS
- **Animations :** CSS parallaxe/brillance, Framer Motion pour les transitions
- **Stockage :** localStorage (données utilisateur) + JSON statique (données de jeu)
- **Données de jeu :** Pipeline CLI Node.js — Wahapedia CSV → JSON
- **Distribution :** PWA avec service workers pour l'offline
- **Hébergement :** Statique (Vercel, Netlify ou GitHub Pages)
