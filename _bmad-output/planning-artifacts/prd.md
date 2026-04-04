---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments:
  - "planning-artifacts/product-brief-PierreHammer.md"
  - "planning-artifacts/product-brief-PierreHammer-distillate.md"
  - "planning-artifacts/research/domain-warhammer40k-app-research-2026-03-31.md"
  - "brainstorming/brainstorming-session-2026-03-31-01.md"
workflowType: 'prd'
briefCount: 2
researchCount: 1
brainstormingCount: 1
projectDocsCount: 0
classification:
  projectType: web_app
  domain: gaming_hobby
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document — PierreHammer

**Author:** Thomas
**Date:** 2026-03-31

## Résumé exécutif

PierreHammer est une PWA Warhammer 40K qui fusionne gestion de collection, construction de listes d'armée et consultation de fiches d'unités en une seule application immersive. Conçue comme un cadeau pour Pierre et son groupe de 5-6 joueurs, elle répond à un parcours aujourd'hui fragmenté entre 2 à 3 outils (New Recruit, Wahapedia, tableurs) qui ne communiquent pas entre eux et ne savent pas ce que le joueur possède.

L'app s'adresse à 4 profils de joueurs — compétiteur, collectionneuse/peintre, narratif, casual — avec un principe de design central : la **walk-up playability**. Si le joueur le moins technique du groupe s'y retrouve sans explication, c'est gagné. Chaque unité est présentée sur une fiche unique et scrollable (zéro accordéon) combinant stats, équipement, capacités, quantité possédée et action d'ajout à une liste.

Les données de jeu proviennent de Wahapedia (export CSV gratuit), transformées via un pipeline CLI Node.js. L'architecture local-first (localStorage + export/import JSON) élimine le besoin de backend, d'authentification et de coûts d'hébergement. Le développement est structuré en deux phases : fondations fonctionnelles, puis wow factor visuel.

### Ce qui rend PierreHammer unique

**Identité visuelle par faction** — L'app se transforme visuellement quand le joueur choisit sa faction : couleurs, typographie, fonds et icônes changent via CSS variables. Les figurines sont présentées en cartes animées avec effets parallaxe et brillance CSS, cadres dorés (Epic Heroes) ou argentés (Battleline). Aucune app W40K existante n'offre ce niveau d'immersion visuelle.

**Fusion collection + army builder** — PierreHammer est le seul outil où "construire une liste" signifie "construire avec ce que tu as". La possession est intégrée dans chaque vue, chaque interaction. Les unités non possédées sont clairement identifiées, transformant l'army builder en outil ancré dans la réalité du joueur.

**Conçue pour la table** — Mode partie avec swipe entre unités, gros texte lisible, et fonctionnement offline via service workers. L'app fonctionne là où les joueurs en ont besoin : smartphone posé sur la table de jeu, avec ou sans WiFi.

## Classification du projet

- **Type :** Web App (PWA / SPA)
- **Domaine :** Gaming / Hobby tabletop (Warhammer 40K)
- **Complexité :** Basse — app privée non commerciale, pas de régulation, pas de paiements, pas de données sensibles
- **Contexte :** Greenfield
- **Stack :** React + TypeScript + Tailwind CSS, localStorage, Wahapedia CSV → JSON

## Critères de succès

### Succès utilisateur

- **Adoption naturelle** — Au moins 3 joueurs sur 6 utilisent PierreHammer lors d'une session de jeu dans les 2 semaines suivant le lancement
- **Remplacement des outils** — Les joueurs cessent d'ouvrir Wahapedia et New Recruit pendant les parties au profit de PierreHammer
- **Effet "wow" immédiat** — Pierre choisit sa faction à la première ouverture et réagit visuellement au skin dynamique et aux cartes animées
- **Zéro friction** — Un joueur qui n'a jamais vu l'app consulte une fiche d'unité et ajoute une figurine à sa collection en moins de 30 secondes, sans aide

### Succès projet

Pas de business model — c'est un cadeau, pas un produit commercial :

- **Le cadeau fait mouche** — Pierre est bluffé par l'attention et la qualité
- **Durabilité** — L'app est encore utilisée par le groupe 3 mois après le lancement
- **Maintenabilité** — Thomas met à jour les données de jeu (pipeline Wahapedia) en moins de 15 minutes après un MFM trimestriel, sans toucher au code

### Succès technique

- **Offline fiable** — L'app fonctionne sans connexion dans un magasin de jeux ou chez un ami avec un WiFi médiocre
- **Performances** — Chargement initial < 3 secondes, navigation entre fiches < 200ms
- **Pipeline robuste** — Le script CLI Wahapedia CSV → JSON traite toutes les factions sans erreur
- **Transition 11ème édition** — La structure de données absorbe les changements de la 11ème édition (juin 2026) sans refonte architecturale

### Indicateurs mesurables

| Indicateur | Cible | Échéance |
|---|---|---|
| Joueurs actifs sur une session | ≥ 3/6 | 2 semaines post-lancement |
| Première utilisation → consultation fiche | < 30 sec | Lancement |
| Mise à jour données post-MFM | < 15 min | Chaque trimestre |
| App utilisable offline | 100% features core | Lancement |
| Utilisation encore active | Oui | 3 mois post-lancement |

## Parcours utilisateurs

### Parcours 1 : Alex le Casual — "C'est quoi déjà mes unités ?"

**Opening** — C'est samedi, Alex a une partie dans 2 heures. Ça fait 3 semaines qu'il n'a pas joué. Il ne se souvient plus des stats de ses Intercessors, ni combien de points fait sa liste habituelle. D'habitude, il ouvre Wahapedia, se perd dans les pages, et finit par demander à Pierre de lui refaire une liste.

**Rising Action** — Alex ouvre PierreHammer. L'app se charge instantanément, il voit ses 4 onglets. Il tape "Collection" — ses Space Marines apparaissent en cartes animées avec le skin bleu Ultramarines. Il voit d'un coup : 22 figurines, dont 18 peintes. Il tape "Mes Listes" et retrouve sa liste "Samedi Chill" à 1000 points.

**Climax** — Il ouvre sa liste et swipe entre ses unités en mode partie. Chaque fiche affiche tout d'un coup — stats, armes, capacités — en gros texte. Il n'a plus besoin de chercher. En arrivant chez Pierre, il n'a pas de WiFi, mais tout fonctionne offline.

**Resolution** — Pour la première fois, Alex arrive à la partie en sachant ce qu'il joue. Pendant la partie, il consulte ses fiches d'un swipe au lieu de demander "c'est quoi la Force de mes Hellblasters ?". Il se sent autonome.

**Capabilities révélées :** Mode partie (swipe, gros texte), offline, fiches zéro accordéon, sauvegarde de listes, chargement rapide.

---

### Parcours 2 : Sophie la Collectionneuse — "Je veux voir ma progression"

**Opening** — Sophie a 150+ figurines Aeldari. Elle peint 3 soirs par semaine. Elle utilise un tableur Google Sheet pour suivre ce qui est peint ou non, mais c'est pénible à mettre à jour et pas très visuel.

**Rising Action** — Sophie ouvre PierreHammer et tombe sur le skin Aeldari — fonds sombres étoilés, tons émeraude et or. Elle parcourt sa collection : chaque figurine apparaît comme une carte animée avec un cadre argenté pour ses Guardians et doré pour son Avatar de Khaine. Le statut de chaque figurine est visible : un Wraithlord "En cours de peinture", ses Dire Avengers "Terminés".

**Climax** — Sophie vient de finir de peindre son Farseer. Elle ouvre la carte, change le statut de "En cours" à "Terminé". La barre de progression de son armée passe de 72% à 73%. Elle fait le toggle "ma collection" et voit ses 150 figurines avec leurs statuts — c'est infiniment plus satisfaisant que son tableur.

**Resolution** — Sophie consulte PierreHammer chaque soir de peinture pour mettre à jour sa progression. Le suivi visuel la motive à finir ses unités non peintes. Quand Pierre lui demande "tu peux amener des Howling Banshees samedi ?", elle vérifie en 2 secondes qu'elle en a 5 montées mais pas encore peintes.

**Capabilities révélées :** Collection avec 4 statuts, barre de progression, galerie de cartes, toggle ma collection/tout, recherche/filtre par statut.

---

### Parcours 3 : Marc le Compétiteur — "Ma liste est-elle légale à 2000 points ?"

**Opening** — Marc prépare un tournoi local en Strike Force (2000 points). Il a une idée de liste Space Marines avec un détachement Gladius, mais il doit vérifier que tout est dans les clous : pas plus de 6 Intercessors, pas plus de 3 enhancements, et que ses Epic Heroes ne sont pas en double.

**Rising Action** — Marc ouvre l'onglet "Mes Listes" et crée une nouvelle liste "Tournoi Mars". Il sélectionne Space Marines et Gladius Task Force. Il ajoute ses unités une par une. Le compteur de points se met à jour en temps réel : 1850... 1920... 1975. Les unités qu'il possède apparaissent normalement, celles qu'il n'a pas sont grisées avec un indicateur visuel.

**Climax** — Marc ajoute un Captain avec le Jump Pack qu'il n'a pas dans sa collection. L'unité apparaît avec un indicateur "non possédé". Il voit immédiatement qu'il a 1975 points — il peut encore ajouter une unité à 25 points. Il cherche dans les fiches, compare, et complète à 2000 points pile.

**Resolution** — Marc arrive au tournoi avec une liste validée, consultable en mode partie offline. Il sait exactement quelles figurines il doit emprunter à Pierre (celles marquées "non possédé"). Plus de mauvaises surprises de dernière minute.

**Capabilities révélées :** Army builder avec calcul de points temps réel, indicateur de possession, création/sauvegarde de listes multiples, validation de composition (Phase 2), filtre par faction/détachement.

---

### Parcours 4 : Thomas le Mainteneur — "GW a sorti un nouveau MFM"

**Opening** — Games Workshop publie le Munitorum Field Manual trimestriel. Les points de dizaines d'unités ont changé. Thomas doit mettre à jour les données de PierreHammer pour que le groupe joue avec les bons points.

**Rising Action** — Thomas ouvre son terminal. Il lance le script CLI : `node pipeline.js update`. Le script vérifie `Last_update.csv` sur Wahapedia, détecte les changements, télécharge les CSV mis à jour, les transforme en JSON et les place dans le dossier de l'app.

**Climax** — Le script termine en quelques secondes. Thomas lance un build et déploie. Il vérifie une unité dont les points ont changé — les nouvelles valeurs sont bien là. Total : moins de 15 minutes.

**Resolution** — Thomas envoie un message dans le groupe : "PierreHammer mis à jour avec le nouveau MFM !" Le groupe joue avec les bons points dès la prochaine partie, sans que Thomas ait eu à toucher une ligne de code.

**Capabilities révélées :** Script CLI pipeline, parsing CSV Wahapedia, transformation JSON, indicateur de version/date de données dans l'app, déploiement statique simple.

---

### Synthèse des capabilities par parcours

| Parcours | Capabilities révélées |
|---|---|
| Alex (Casual) | Mode partie, offline, fiches zéro accordéon, sauvegarde listes, chargement rapide |
| Sophie (Peintre) | Collection 4 statuts, barre de progression, galerie cartes, toggle, filtre par statut |
| Marc (Compétiteur) | Army builder, calcul points temps réel, indicateur possession, multi-listes, validation composition |
| Thomas (Mainteneur) | Script CLI pipeline, parsing CSV, transformation JSON, indicateur version données, déploiement statique |

## Exigences techniques PWA

### Architecture

- **Type :** SPA React avec service workers pour le mode offline / PWA
- **Rendu :** Client-side rendering uniquement — pas de SSR, pas de SEO (app privée)
- **État :** État local géré côté client (React state + localStorage), pas de synchronisation serveur
- **Données de jeu :** JSON statique intégré au build, généré par le pipeline CLI Wahapedia
- **Données utilisateur :** localStorage avec export/import JSON pour backup et transfert entre appareils

### Support navigateur

| Navigateur | Priorité | Justification |
|---|---|---|
| Chrome Mobile (Android) | Primaire | Navigateur dominant sur Android, meilleur support PWA |
| Safari Mobile (iOS) | Primaire | Seul moteur autorisé sur iOS |
| Chrome Desktop | Secondaire | Consultation confort à la maison |
| Firefox / Edge | Bonus | Support si pas d'effort supplémentaire |

### Responsive design

- **Mobile-first** — Design conçu pour écrans 360-428px de large (smartphones standards)
- **Tactile** — Zones de tap minimum 44x44px, espacement suffisant entre éléments interactifs
- **Mode partie** — Optimisé pour lecture à distance de bras (gros texte, contrastes forts)
- **Desktop** — Layout adapté mais pas prioritaire, grille de cartes plus large

### Considérations d'implémentation

- **Offline-first** : service workers avec stratégie cache-first pour les données de jeu, les assets et l'app shell
- **Pas de temps réel** : toutes les données sont locales, pas de WebSocket ni polling
- **Déploiement statique** : Vercel, Netlify ou GitHub Pages — build React standard, pas de serveur
- **PWA manifest** : icône PierreHammer, splash screen, mode standalone

## Scope & développement phasé

### Stratégie MVP

**Approche :** MVP d'expérience — Le minimum viable n'est pas juste "ça fonctionne", c'est "ça fait mouche comme cadeau". La Phase 1 livre une app fonctionnelle et complète, la Phase 2 ajoute le wow factor visuel qui transforme l'outil en cadeau mémorable. Les deux phases constituent ensemble le MVP.

**Ressources :** Thomas seul, budget de dizaines d'heures, pas de coûts d'hébergement (statique).

### Couverture des parcours par phase

| Parcours | Phase 1 | Phase 2 |
|---|---|---|
| Alex (Casual) | Fiches zéro accordéon, sauvegarde listes, offline | Mode partie (swipe, gros texte) |
| Sophie (Peintre) | Collection 4 statuts, toggle, progression | Cartes animées, skin faction |
| Marc (Compétiteur) | Calcul points, indicateur possession, multi-listes | Validation composition avancée |
| Thomas (Mainteneur) | Pipeline CLI, parsing CSV, déploiement | — |

### Phase 1 — Fondations fonctionnelles

- Pipeline Wahapedia CSV → JSON (script CLI Node.js)
- Structure de données flexible (factions, datasheets, keywords, points)
- PWA offline avec service workers
- Fiche d'unité fusionnée, zéro accordéon
- Collection avec 4 statuts + toggle "ma collection / tout"
- Army builder basique (calcul points, alerte dépassement)
- Navigation 4 onglets (Collection | Mes Listes | Catalogue | Profil), max 2 niveaux
- localStorage + export/import JSON
- Zéro onboarding — 3 taps et c'est opérationnel

### Phase 2 — Wow factor & polish

- Cartes de figurines animées (parallaxe CSS, brillance, cadres or/argent)
- Skin dynamique par faction (CSS variables : couleurs, typo, fonds, icônes)
- Mode partie (swipe entre unités, gros texte)
- Validation avancée de composition (détachements, leaders, enhancements, Epic Heroes)
- Touches personnelles (easter eggs, splash screen Pierre)

### V1.5 — Améliorations post-MVP

- Suggestions de listes automatiques ("avec tes figurines, voici 3 listes")
- Notifications de changements de points (diff post-MFM)
- Historique des parties (date, joueurs, factions, score)
- Profils amis et collections visibles
- Dashboard progression hobby (stats, courbes)
- Calculateur de budget unifié (figurines + peintures)

### V2 — Vision long terme

- MathHammer intégré (simulateur de combat probabiliste Monte Carlo)
- Module méta complet (winrates par faction/détachement, tendances)
- Module peinture (guides par figurine, conversion Citadel/Vallejo/Army Painter, shopping list)
- Gamification (classement amical, badges, récap mensuel "Wrapped")
- Mode Crusade (XP, noms custom, journal de campagne)
- Army builder avancé (comparaison par swipe, building par budget, counter-pick)

### Stratégie de mitigation des risques

**Risques techniques :**

| Risque | Sévérité | Mitigation |
|---|---|---|
| Wahapedia change le schéma CSV sans préavis | Haute | Valider le parser contre 3 factions avant tout code UI. Tests unitaires solides sur le parser. |
| Wahapedia disparaît (pression légale GW) | Haute | Sauvegarder localement les CSV de référence. L'app continue avec les dernières données importées. |
| Service workers servent des données stale | Haute | Indicateur de version dans l'app. Cache versionnée avec invalidation au build. |
| Estimation sous-évaluée | Moyenne | Les 2 phases permettent de livrer Phase 1 fonctionnelle même si Phase 2 prend plus de temps. |

**Risques produit :**

| Risque | Sévérité | Mitigation |
|---|---|---|
| GW sort une app officielle améliorée pour la 11ème éd | Moyenne | PierreHammer reste unique (collection + possession + wow visuel). Gratuit vs abonnement. |
| Le groupe n'adopte pas l'app | Moyenne | Tester avec Pierre dès la Phase 1. Walk-up playability comme critère de design. |
| Scope creep post-lancement | Moyenne | Périmètre "done" clair. V1.5/V2 sont des possibilités, pas des engagements. |

**Risque clé à dé-risquer en premier :** Le pipeline Wahapedia. C'est le fondement de tout — si le parsing CSV ne fonctionne pas, rien ne fonctionne. À construire et valider en tout premier.

## Exigences fonctionnelles

### Données de jeu & pipeline

- **FR1:** Thomas peut exécuter un script CLI qui télécharge les CSV Wahapedia et les transforme en JSON optimisé pour l'app
- **FR2:** Le pipeline peut parser les fichiers CSV Wahapedia (Factions, Datasheets, Abilities, Keywords, Models, Wargear, Points) et les lier par identifiants
- **FR3:** Le pipeline peut détecter si les données Wahapedia ont été mises à jour en comparant `Last_update.csv`
- **FR4:** L'app peut afficher la date de dernière mise à jour des données de jeu
- **FR5:** L'app peut fonctionner avec les données JSON intégrées au build, sans appel réseau au runtime

### Collection

- **FR6:** Le joueur peut marquer une unité comme possédée et définir la quantité possédée
- **FR7:** Le joueur peut attribuer un statut de progression à chaque figurine (non montée, montée, en cours de peinture, terminée)
- **FR8:** Le joueur peut basculer l'affichage entre "ma collection" et "tout le catalogue"
- **FR9:** Le joueur peut voir une barre de progression de sa collection (pourcentage par statut)
- **FR10:** Le joueur peut filtrer et rechercher dans sa collection par faction, mot-clé, statut de peinture ou nom d'unité

### Army builder

- **FR11:** Le joueur peut créer, nommer, sauvegarder et supprimer des listes d'armée
- **FR12:** Le joueur peut sélectionner une faction et un détachement pour une liste
- **FR13:** Le joueur peut ajouter et retirer des unités d'une liste
- **FR14:** Le joueur peut voir le total de points de sa liste mis à jour en temps réel
- **FR15:** Le joueur peut recevoir une alerte visuelle quand sa liste dépasse la limite de points sélectionnée (1000 / 2000 / 3000)
- **FR16:** Le joueur peut distinguer visuellement les unités possédées des unités non possédées dans l'army builder
- **FR17:** Le joueur peut gérer plusieurs listes simultanément
- **FR18:** Le joueur peut valider la composition de sa liste selon les règles W40K (max 6 BATTLELINE, max 3 Enhancements, Epic Heroes uniques) *(Phase 2)*

### Consultation de fiches d'unités

- **FR19:** Le joueur peut consulter la fiche complète d'une unité sur une seule vue scrollable (stats, équipement, capacités, mots-clés, points)
- **FR20:** Le joueur peut voir sur la fiche d'unité le nombre de figurines possédées et leur statut de peinture
- **FR21:** Le joueur peut ajouter une unité à une liste directement depuis sa fiche
- **FR22:** Le joueur peut parcourir les unités par faction
- **FR23:** Le joueur peut rechercher une unité par nom ou mot-clé

### Mode partie

- **FR24:** Le joueur peut activer un mode partie qui affiche uniquement les unités de la liste active
- **FR25:** Le joueur peut naviguer entre les fiches d'unités de sa liste par swipe horizontal *(Phase 2)*
- **FR26:** Le joueur peut consulter les fiches en mode partie avec un texte agrandi lisible à distance de bras *(Phase 2)*

### Identité visuelle & immersion

- **FR27:** L'app peut appliquer un thème visuel dynamique (couleurs, typographie, fonds, icônes) correspondant à la faction consultée *(Phase 2)*
- **FR28:** L'app peut afficher les figurines sous forme de cartes animées avec effets parallaxe et brillance *(Phase 2)*
- **FR29:** L'app peut différencier visuellement les cartes par type d'unité (cadre doré Epic Heroes, argenté Battleline) *(Phase 2)*
- **FR30:** L'app peut afficher les images de figurines sourcées depuis Wahapedia *(Phase 2)*

### Persistance & portabilité

- **FR31:** L'app peut sauvegarder les données utilisateur (collection, listes) en localStorage
- **FR32:** Le joueur peut exporter ses données utilisateur en fichier JSON
- **FR33:** Le joueur peut importer des données utilisateur depuis un fichier JSON
- **FR34:** L'app peut fonctionner entièrement offline après le premier chargement

### Navigation & UX

- **FR35:** Le joueur peut naviguer via une barre de navigation à 4 onglets (Collection, Mes Listes, Catalogue, Profil)
- **FR36:** Le joueur peut atteindre n'importe quelle information en maximum 2 niveaux de navigation
- **FR37:** Le joueur peut commencer à utiliser l'app sans onboarding ni création de compte

### Touches personnelles

- **FR38:** L'app peut afficher des éléments personnalisés pour Pierre (splash screen, easter eggs) *(Phase 2)*

## Exigences non fonctionnelles

### Performance

- **NFR1:** Chargement initial < 3 secondes sur connexion mobile 4G
- **NFR2:** Navigation entre fiches d'unités < 200ms (transition fluide)
- **NFR3:** Calcul de points dans l'army builder < 50ms à l'ajout/retrait d'une unité
- **NFR4:** Recherche/filtre dans la collection < 100ms, même avec 200+ unités
- **NFR5:** Animations CSS (parallaxe, brillance) à 60fps sur smartphone milieu de gamme (2022+)
- **NFR6:** Bundle applicatif < 2 Mo (hors données JSON de jeu)

### Fiabilité & offline

- **NFR7:** Fonctionnement à 100% sans connexion internet après le premier chargement
- **NFR8:** Données utilisateur (localStorage) jamais corrompues par un crash ou fermeture brutale
- **NFR9:** Import JSON valide l'intégrité des données avant d'écraser les données existantes
- **NFR10:** Service worker sert la version correcte des données correspondant au dernier build déployé

### Maintenabilité

- **NFR11:** Pipeline Wahapedia CSV → JSON exécuté en < 2 minutes pour toutes les factions
- **NFR12:** Messages d'erreur clairs si un fichier CSV a un format inattendu
- **NFR13:** Mise à jour complète des données (pipeline + build + déploiement) réalisable en < 15 minutes
- **NFR14:** Code structuré pour permettre l'ajout de fonctionnalités (V1.5, V2) sans refonte architecturale

### Compatibilité

- **NFR15:** Chrome Mobile 90+ et Safari iOS 15+
- **NFR16:** Écrans de 360px à 428px de large (smartphones standards)
- **NFR17:** Zones interactives minimum 44x44px pour utilisation tactile
