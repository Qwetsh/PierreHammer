---
stepsCompleted: [1]
inputDocuments: []
workflowType: 'research'
lastStep: 1
research_type: 'domain'
research_topic: 'Warhammer 40K - Système de jeu, règles, points et écosystème applicatif'
research_goals: 'Comprendre les règles W40K, le système de points/figurines, les sources de données disponibles et les outils existants pour concevoir une PWA de gestion de collection et création d armées'
user_name: 'Thomas'
date: '2026-03-31'
web_research_enabled: true
source_verification: true
---

# Research Report: domain

**Date:** 2026-03-31
**Author:** Thomas
**Research Type:** domain

---

## Research Overview

[Research overview and methodology will be appended here]

---

<!-- Content will be appended sequentially through research workflow steps -->

## Domain Research Scope Confirmation

**Research Topic:** Warhammer 40K - Système de jeu, règles, points et écosystème applicatif
**Research Goals:** Comprendre les règles W40K, le système de points/figurines, les sources de données disponibles et les outils existants pour concevoir une PWA de gestion de collection et création d'armées

**Domain Research Scope:**

- Structure du jeu — mécaniques fondamentales, factions, unités, profils, mots-clés, détachements, système de points
- Système de points & mises à jour — Munitorum Field Manual, fréquence des ajustements, format des données
- Sources de données — sources fiables et exploitables (Wahapedia, APIs communautaires, PDFs officiels GW)
- Écosystème applicatif existant — outils concurrents, forces, faiblesses et lacunes
- Contraintes légales — propriété intellectuelle GW, utilisation des données

**Research Methodology:**

- All claims verified against current public sources
- Multi-source validation for critical domain claims
- Confidence level framework for uncertain information
- Comprehensive domain coverage with industry-specific insights

**Scope Confirmed:** 2026-03-31

## Industry Analysis

### Taille du marché et valorisation

Games Workshop (GW) domine le marché des jeux de figurines avec un **chiffre d'affaires de £617,5 millions** pour l'exercice fiscal se terminant en juin 2025 (contre £525,7M en 2024). Pour le premier semestre 2025-2026, le chiffre d'affaires a atteint £332,1M (+17%), avec un bénéfice avant impôts de £140,8M (+11%) — un **record historique**.

_Taille du marché global des jeux de figurines : ~4,2 milliards USD (2025), projeté à 7,4 milliards USD d'ici 2033_
_Taux de croissance : CAGR de ~8,5%_
_Part de GW : position dominante, largement leader du segment Warhammer_
_Impact économique : accord Amazon pour films/séries TV Warhammer 40K, boostant la visibilité_
_Sources : [Games Workshop Revenue](https://companiesmarketcap.com/games-workshop-group/revenue/), [Record Half-Year](https://www.belloflostsouls.net/2026/01/games-workshop-2025-2026-half-yearly-financials-record-half-year.html)_

### Dynamiques du marché et croissance

Le marché Warhammer 40K est en pleine expansion, porté par la 10ème édition (sortie 2023) et l'annonce de la **11ème édition prévue pour juin 2026**. L'accord avec Amazon pour des adaptations audiovisuelles a créé un effet de levier massif sur la notoriété de la marque.

_Moteurs de croissance : nouvelle édition tous les 3 ans, adaptations médias (Amazon), communauté très engagée_
_Freins : prix élevé d'entrée dans le hobby (~300-500€ pour démarrer), complexité des règles_
_Cycles : mises à jour trimestrielles (Munitorum Field Manual) + nouvelles éditions tous les ~3 ans_
_Maturité : marché mature mais en croissance soutenue grâce à la diversification médias_
_Sources : [11th Edition Announced](https://www.belloflostsouls.net/2026/03/warhammer-40k-adepticon-2026-11th-edition-announced.html), [Wargamer](https://www.wargamer.com/warhammer-40k/11th-edition)_

### Structure du marché et segmentation

**Segments de jeu (tailles d'armée) :**
- **Incursion** : 1 000 points — parties rapides
- **Strike Force** : 2 000 points — format standard compétitif
- **Onslaught** : 3 000 points — grandes batailles

**Structure du jeu en 10ème édition :**
- **Factions** : chaque joueur choisit une faction (Space Marines, Orks, Tyranides, etc.)
- **Détachements** : ensemble de règles thématiques qui s'appliquent à toute l'armée (règle spéciale, stratagèmes, améliorations). Les Index en proposent 1, les Codex 4+
- **Datasheets** : fiches d'unité détaillées avec profils de caractéristiques, équipement, capacités
- **Points** : chaque unité a un coût en points, défini dans le Munitorum Field Manual
- **Mots-clés** : BATTLELINE, DEDICATED TRANSPORT, CHARACTER, EPIC HERO — structurent la composition d'armée

**Règles de composition :**
- Max 6 unités par datasheet BATTLELINE ou DEDICATED TRANSPORT
- Les Characters peuvent recevoir des Enhancements (max 3 par armée)
- Les Epic Heroes sont uniques (1 seul exemplaire par armée)

_Sources : [Core Rules Wahapedia](https://wahapedia.ru/wh40k10ed/the-rules/core-rules/), [Warhammer Community - Army Building](https://www.warhammer-community.com/2023/03/30/how-army-building-works-in-the-new-edition-of-warhammer-40000/), [Detachments Guide](https://www.wargamer.com/warhammer-40k/detachments)_

### Système de points et mises à jour

Le **Munitorum Field Manual (MFM)** est le document officiel GW qui liste les coûts en points de toutes les unités. C'est LA pièce maîtresse pour l'application de Thomas.

**Fréquence de mise à jour :**
- Objectif GW : **mise à jour MFM chaque trimestre**, Balance Dataslate tous les 2 trimestres
- En pratique (10ème édition) : v1.0 à v3.7+ depuis juin 2023
- Dernière mise à jour : **Mars 2026** (version la plus récente)
- Prochaine mise à jour attendue : probablement avec la **11ème édition (juin 2026)**

**Format du document :**
- PDF officiel téléchargeable sur warhammer-community.com
- Liste faction par faction, unité par unité avec le coût en points
- Les PDFs sont hébergés sur `assets.warhammer-community.com`

_Sources : [MFM Guide](https://spikeybits.com/munitorum-field-manual-points-update-10th-edition-40k-changes-guide/), [MFM Mars 2025 PDF](https://assets.warhammer-community.com/eng_warhammer40000_munitorum_field_manual_march_2025-ueydgt3lgg-pw7d5pv486.pdf), [Frontline Gaming Mars 2026](https://frontlinegaming.org/2026/03/04/summary-of-points-changes-in-the-march-2026-warhammer-40k-munitorum-field-manual/)_

### Transition vers la 11ème édition (juin 2026)

⚠️ **Point critique pour le projet** : la 11ème édition arrive dans ~3 mois.

**Ce qui change :**
- 70 nouveaux détachements ajoutés
- Possibilité de sélectionner **plusieurs détachements** par armée
- Suppression du stacking de stratagèmes
- Les codex actuels restent **compatibles** avec la 11ème édition
- Objectifs liés au terrain plutôt qu'aux marqueurs circulaires

**Impact pour l'app :**
- La structure de données des datasheets devrait rester similaire
- Le système de points perdurera mais les valeurs changeront
- Les règles de composition d'armée vont évoluer (multi-détachements)
- **Recommandation** : concevoir l'architecture de données de façon flexible pour absorber ces changements

_Sources : [11th Edition Guide](https://www.wargamer.com/warhammer-40k/11th-edition), [GamesRadar](https://www.gamesradar.com/tabletop-gaming/everything-we-know-about-warhammer-40k-11th-edition/), [Goonhammer](https://www.goonhammer.com/first-look-at-warhammer-40k-11th-edition-at-adepticon/)_

### Sources de données disponibles

#### Wahapedia — Source principale recommandée

Wahapedia fournit un **export CSV complet** de toutes les données du jeu, lié par identifiants :
- `Last_update.csv` — date de dernière mise à jour
- Factions, Datasheets, Abilities, Keywords, Models, Wargear options
- Spécifications disponibles en anglais et russe
- Mis à jour dans les ~30 minutes suivant les corrections/ajouts
- **Gratuit**, demande simplement une mention de Wahapedia

Le projet open-source **[Depot](https://github.com/fjlaubscher/depot)** démontre qu'il est viable de construire une app complète à partir des CSV Wahapedia.

_Sources : [Wahapedia Data Export](https://wahapedia.ru/wh40k9ed/the-rules/data-export/), [Depot GitHub](https://github.com/fjlaubscher/depot)_

#### Autres sources
- **PDFs officiels GW** : Munitorum Field Manual, Balance Dataslates
- **Warhammer Community** : annonces officielles, FAQs
- **Lexicanum** : wiki communautaire avec API sandbox

### Paysage concurrentiel — Apps existantes

| App | Type | Prix | Forces | Faiblesses |
|-----|------|------|--------|------------|
| **App officielle W40K (Battle Forge)** | Mobile | Payante (abonnement) | Données officielles GW, toujours à jour | Payante, interface critiquée, limitée aux listes |
| **New Recruit** | Web | Gratuit | Moderne, communautaire, ex-équipe BattleScribe | Pas dispo sur iPhone, pas de gestion de collection |
| **BattleScribe** | Mobile/Desktop | Gratuit | Historiquement populaire | Abandonné par le développeur, données obsolètes |
| **BattleBase** | Web | Gratuit | Tournois, suivi CP, scoring temps réel | Focus compétitif, pas de gestion de collection |
| **Wahapedia** | Web | Gratuit | Données exhaustives, consultation de règles | Pas d'army builder, pas de gestion de collection |

**Lacune identifiée** : Aucun outil ne combine **gestion de collection + army builder + vérification de possession + données à jour** dans une seule app. C'est exactement le créneau du projet de Thomas !

_Sources : [Best Army Builders](https://spikeybits.com/battlescribe-alternative-warhammer-40k-10th-edition-army-list-builder-apps/), [Rosterizer Review](https://www.wargamer.com/warhammer-40k/app-alternative-rosterizer)_

### Contraintes légales — Propriété intellectuelle GW

⚠️ **Games Workshop est extrêmement agressif sur la protection de sa PI.**

**Ce qui est interdit :**
- Créer des apps/jeux basés sur les personnages et univers GW **sans licence**
- Utiliser des visuels, noms trademarqués, ou assets GW
- Commercialiser une app utilisant leurs données

**Ce qui est toléré (zone grise) :**
- Les outils communautaires gratuits comme Wahapedia, New Recruit, BattleScribe ont fonctionné pendant des années
- L'utilisation des **données mécaniques** (points, stats) est généralement tolérée tant que :
  - L'app est **gratuite et non commerciale**
  - Elle ne reproduit pas le contenu narratif/artistique
  - Elle renvoie vers les sources officielles
  - Elle ne se présente pas comme un produit officiel GW

**Recommandation pour le projet** : App privée entre amis = risque quasi nul. Si publication publique un jour, rester gratuit et ne pas utiliser d'assets GW.

_Sources : [GW IP Guidelines](https://spikeybits.com/2021/07/lookout-youtube-gw-just-updated-their-ip-guidelines.html), [GW Legal](https://www.warhammer.com/en-GB/legal)_
