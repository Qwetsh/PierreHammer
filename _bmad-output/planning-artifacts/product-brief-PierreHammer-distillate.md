---
title: "Product Brief Distillate: PierreHammer"
type: llm-distillate
source: "product-brief-PierreHammer.md"
created: "2026-03-31"
purpose: "Token-efficient context for downstream PRD creation"
---

# PierreHammer — Detail Pack

## Contexte projet

- App-cadeau privée, non commerciale — Thomas (dev, ne joue pas à W40K) pour Pierre et 5-6 amis joueurs
- Nom : PierreHammer (Pierre + Warhammer)
- Thomas a une forte sensibilité UX/visuelle mais ne connaît pas l'univers W40K — le brainstorming Role Playing a compensé ce gap
- Budget : dizaines d'heures de dev, pas de budget monétaire
- 2 serveurs Supabase déjà utilisés (quotas épuisés) → Firebase si besoin de DB, mais local-first retenu pour le MVP

## Profils utilisateurs détaillés

- **Marc "Le Compétiteur"** — Joue en tournois, optimise ses listes, surveille les changements de points MFM trimestriels. Besoin : calcul de points rapide, diff de changements, validation de composition
- **Sophie "La Collectionneuse/Peintre"** — 150+ figurines, peint 3 soirs/semaine. Besoin : suivi de progression peinture, galerie visuelle, shopping list peintures
- **Lucas "Le Narratif"** — Joue pour l'histoire, mode Crusade, noms custom. Besoin : historique de parties, journal de campagne, immersion visuelle
- **Alex "Le Casual"** — Joue 1x/mois, oublie les règles entre chaque partie. Besoin : zéro complexité, tout visible d'un coup, suggestions de listes prêtes
- **Insight clé** : si Alex (le casual) s'y retrouve, tout le monde s'y retrouve — c'est le test UX de référence
- **Feedback ami de Thomas** : zéro accordéon confirmé comme pain point réel, tout doit être visible d'un coup

## Données de jeu W40K — Structure

- **Factions** : chaque joueur choisit une faction (Space Marines, Orks, Tyranides, etc.)
- **Détachements** : ensemble de règles thématiques (règle spéciale, stratagèmes, améliorations). Index = 1 détachement, Codex = 4+
- **Datasheets** : fiches d'unité — profils de caractéristiques, équipement, capacités, mots-clés
- **Points** : coût par unité défini dans le Munitorum Field Manual (MFM), mis à jour ~trimestriellement
- **Mots-clés structurants** : BATTLELINE, DEDICATED TRANSPORT, CHARACTER, EPIC HERO
- **Règles de composition (10ème éd)** : max 6 unités par datasheet BATTLELINE/TRANSPORT, max 3 Enhancements par armée, Epic Heroes uniques (1 par armée)
- **Tailles de parties** : Incursion (1000 pts), Strike Force (2000 pts — standard compétitif), Onslaught (3000 pts)

## 11ème édition (juin 2026) — Impact

- 70 nouveaux détachements ajoutés
- Possibilité de sélectionner **plusieurs détachements** par armée (changement majeur)
- Suppression du stacking de stratagèmes
- Codex actuels **compatibles** avec la 11ème édition
- Objectifs liés au terrain (remplace marqueurs circulaires)
- **Impact app** : structure datasheets similaire, points changent, règles de composition évoluent (multi-détachements)
- **Wahapedia** pourrait ne pas avoir les données 11ème éd immédiatement au lancement — prévoir un délai

## Sources de données — Wahapedia CSV

- Export CSV complet et gratuit : Factions, Datasheets, Abilities, Keywords, Models, Wargear options
- `Last_update.csv` — date de dernière mise à jour, utilisable pour détecter les changements
- Disponible en anglais et russe
- Mis à jour dans les ~30 minutes suivant les corrections
- Demande simplement une mention de Wahapedia
- Projet open-source **Depot** (github.com/fjlaubscher/depot) prouve la viabilité d'une app basée sur ces CSV
- **Risque** : Wahapedia subit des pressions légales GW (ban Patreon) — source potentiellement volatile
- **Pas de contrat API** : CSV maintenus par des bénévoles, schéma peut changer sans préavis

## Analyse concurrentielle détaillée

- **App officielle W40K (Battle Forge)** : payante (abonnement Warhammer+), données toujours à jour, mais UX critiquée, bugs fréquents, pas de collection. Les utilisateurs se plaignent de "payer pour beta-tester"
- **New Recruit** : gratuit, moderne, ex-équipe BattleScribe, mais pas dispo sur iPhone, pas de gestion de collection
- **BattleScribe** : abandonné définitivement par le développeur, données obsolètes — communauté data dev migrée vers New Recruit
- **BattleBase** : focus compétitif (tournois, CP, scoring temps réel), pas de collection
- **Wahapedia** : données exhaustives, consultation de règles, mais pas d'army builder, pas de collection, pannes fréquentes
- **GrimSlate** : army builder gratuit récent, pas de collection, pas d'offline
- **Figure Case / Miniatures Manager** : tracking collection + peinture, mais pas de list building ni règles
- **Rosterizer** : en beta, game-agnostic, limité
- **Gap confirmé** : aucun outil ne combine collection + army builder + possession + wow visuel

## Idées retenues — MVP (Phase 1 + Phase 2)

- **#30** Fiche unité fusionnée (datasheet + collection + army builder) — ADN de l'app
- **#15** Zéro accordéon — tout visible d'un coup sur une page scrollable
- **#8** Statuts de progression collection : Non montée → Montée → En cours de peinture → Terminée
- **#26** Toggle "ma collection" / "tout le catalogue"
- **#29** Pipeline Wahapedia CSV → JSON (script CLI, exécution manuelle)
- **#5** PWA offline (service workers)
- **#19** Cartes de figurine animées — parallaxe CSS, brillance, cadres dorés (Epic Heroes) / argentés (Battleline)
- **#33** Skin dynamique par faction — CSS variables (couleurs, typo, icônes, fonds)
- **#16** Mode partie — swipe entre unités de la liste active, gros texte lisible
- **#36** Zéro onboarding — 3 taps et c'est opérationnel
- **#37** Navigation max 2 niveaux — bottom nav 4 onglets : Collection | Mes Listes | Catalogue | Profil
- **#9** Expérience immersive — fonds d'ambiance par faction, transitions Framer Motion

## Idées retenues — V1.5

- **#1** Notification de changement de points — diff "ta liste X est passée de 1985 à 2010 pts"
- **#14** Historique des parties — log simple : date, joueurs, factions, points, score, résultat
- **#4 + #31** Calculateur de budget unifié (figurines + peintures)
- **#17** Suggestions de listes auto-générées — "Avec tes figurines, voici 3 listes prêtes à jouer"
- **#20** Dashboard progression hobby — stats visuelles, courbes, figurines peintes ce mois
- **#10** Profils amis — collections visibles, échanges/prêts

## Idées retenues — V2

- **#2** MathHammer intégré — simulateur de combat probabiliste (Monte Carlo)
- **#3 + #34** Module Méta complet — winrates par faction/détachement, tendances dans le temps
- **#6 + #7 + #12** Module peinture — guides par figurine, conversion Citadel/Vallejo/Army Painter, shopping list auto
- **#27** Board kanban de peinture — colonnes visuelles, drag & drop
- **#21 + #22 + #23** Gamification — classement amical, badges, récap mensuel "Wrapped"
- **#35** Organisateur de parties — croisement dispos + collections
- **#13** Mode Crusade — XP, noms custom, traits acquis, timeline
- **#32 + #38 + #39** Army builder avancé — comparaison par swipe, building par budget, counter-pick

## Idées rejetées

- **#18** Galerie Pokédex — Thomas a explicitement préféré les cartes animées comme paradigme visuel
- Gamification dès le MVP — trop de scope, gardé pour V2
- Backend/auth dès le MVP — local-first retenu pour la simplicité

## Décisions d'architecture

- **Local-first** : localStorage pour données utilisateur (collection, listes), export/import JSON pour backup/transfert
- **Pas de Firebase pour le MVP** : pas de backend, pas d'auth, pas de coûts
- **Pipeline data manuel** : script CLI Node.js exécuté par Thomas après chaque MFM (~trimestriel), pas d'automatisation complexe
- **Indicateur de fraîcheur** : date de dernière mise à jour des données visible dans l'app
- **Validation army builder simplifiée pour Phase 1** : calcul de points + alerte dépassement uniquement. Validation complète (détachements, leaders, enhancements, Epic Heroes) en Phase 2
- **2 phases de dev** : Phase 1 = fondations fonctionnelles (architecture, data, features core). Phase 2 = wow factor visuel + polish. Architecture solide dès le départ pour éviter les refactorisations
- **Images** : sourcées depuis Wahapedia (acceptable pour une app privée non commerciale)
- **Hébergement** : statique (Vercel, Netlify ou GitHub Pages)

## Contraintes légales — IP Games Workshop

- GW est extrêmement agressif sur la protection de sa PI
- App privée entre amis = risque quasi nul
- Si publication publique : rester gratuit, ne pas utiliser d'assets GW, ne pas se présenter comme produit officiel
- Données mécaniques (points, stats) tolérées tant que non commercial et renvoi vers sources officielles
- Wahapedia elle-même opère dans une zone grise tolérée

## Marché & contexte

- Games Workshop : £617,5M CA FY2025, record H1 2025-26 (+17%)
- Marché global jeux de figurines : ~$4,2B (2025), projeté $7,4B d'ici 2033, CAGR ~8,5%
- Amazon TV/film deal + Space Marine 2 (7M+ copies) → afflux de nouveaux joueurs
- GW : 570+ magasins, ~30 ouvertures/an
- Entrée dans le hobby : ~300-500€ → feature budget utile

## Questions ouvertes

- Wahapedia sera-t-il disponible pour la 11ème édition dès le lancement (juin 2026) ?
- GW pourrait-il sortir une app officielle améliorée pour la 11ème édition ?
- Combien de factions couvrir au lancement ? (toutes vs uniquement celles jouées par le groupe)
- Quelle est la date cible pour offrir le cadeau à Pierre ?
- Le mode partie (swipe) est-il réellement supérieur à un scroll libre pour la consultation en jeu ? À tester avec le groupe
