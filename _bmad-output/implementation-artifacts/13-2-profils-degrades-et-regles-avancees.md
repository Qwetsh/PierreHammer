# Story 13.2: Profils dégradés et règles avancées

Status: review

## Story

As a joueur en partie,
I want que la simulation prenne en compte les profils dégradés des véhicules/monstres blessés,
so that les résultats reflètent la réalité du champ de bataille quand une unité est affaiblie.

## Acceptance Criteria

1. Les unités avec un `damagedRange` (véhicules, monstres) utilisent leur profil dégradé quand les blessures restantes sont dans la range
2. Le profil dégradé affecte les stats de combat (BS/WS dégradé, mouvement réduit, etc.)
3. Le `damagedDescription` est affiché visuellement quand l'unité est endommagée
4. Les unités multi-profil (ex: escouade avec sergent + marines) utilisent le bon profil par modèle
5. La simulation prend en compte le leader attaché (ses armes s'ajoutent à l'escouade)

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2, #3): Profils dégradés
  - [x] Parser `damagedRange` (ex: "1-6" signifie "quand il reste 1 à 6 wounds")
  - [x] Créer `src/utils/profileResolver.ts`
  - [x] Fonction `resolveActiveProfile(datasheet: Datasheet, woundsRemaining: number | null): Profile`
  - [x] Si `woundsRemaining` est dans le `damagedRange` → parser `damagedDescription` pour les malus
  - [x] Patterns de dégradation courants :
    - "Each time this model makes an attack, subtract 1 from the Hit roll" → -1 to hit
    - "Subtract X from this model's Objective Control" → informatif
  - [x] Afficher un badge "Endommagé" et la description sur l'unité en game mode
  - [x] Tests: véhicule à 5/22 wounds → profil dégradé appliqué

- [x] Task 2 (AC: #4): Unités multi-profil
  - [x] Certaines datasheets ont plusieurs `Profile` (ex: Sergeant + Marine)
  - [x] Lors du calcul d'attaques, sommer les attaques de chaque profil × nombre de modèles de ce profil
  - [x] Le nombre de modèles par profil est déduit de `unitComposition` (parser le texte)
  - [x] Si un profil est un personnage embarqué (Sergeant), il a souvent des armes différentes
  - [x] Fonction `parseModelDistribution` pour distribuer les modèles par profil
  - [x] Tests: escouade de 5 avec sergeant → distribution correcte

- [x] Task 3 (AC: #5): Leader attaché
  - [x] Si un héros est `attachedToId` à l'escouade attaquante, ses armes s'ajoutent aux attaques
  - [x] Le simulateur affiche les armes du leader comme des options supplémentaires avec badge [Leader]
  - [x] Fonction `getCombinedWeapons` combine armes escouade + leader
  - [x] Tests: escouade + leader attaché → attaques combinées

- [x] Task 4: Intégration dans le simulateur
  - [x] Profils dégradés mergés dans attackerEffects/defenderEffects via resolveActiveProfile
  - [x] Sélection d'arme inclut les armes du leader attaché via getCombinedWeapons
  - [x] Badge "Endommagé" affiché quand unité dans damagedRange
  - [x] GameModePage passe leaderDatasheet au ContextualSimulator
  - [x] 448 tests total, 6 nouveaux pour Tasks 2-3, 0 régression

## Dev Notes

- Les profils dégradés en W40K 10e sont simples : c'est un malus de -1 to hit pour la plupart des véhicules/monstres quand ils sont sous un certain seuil de wounds.
- Le `damagedRange` est un string "1-6" — parser en min/max
- Le `damagedDescription` est du HTML — le parser pour en extraire les malus mécaniques (même approche que le stratagemEffectParser)
- Pour les unités multi-profil : en pratique, la plupart des escouades ont un profil unique. Les multi-profils sont rares (sergeant avec stats différentes). On peut commencer simple.
- La règle "Look Out, Sir" en 10e : quand un leader est attaché à une escouade, les wounds vont aux bodyguards d'abord (tant qu'il reste des bodyguards). C'est déjà partiellement modélisé par le système d'attachement (`attachedToId`).
- Cette story est la plus complexe en termes de règles — elle peut être découpée davantage si nécessaire.

### References
- Types: src/types/gameData.types.ts (Profile, damagedRange, damagedDescription)
- combatEngine: src/utils/combatEngine.ts (Story 11.3)
- listsStore: src/stores/listsStore.ts (attachedToId)
- gameSessionStore: src/stores/gameSessionStore.ts (woundsRemaining)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- profileResolver: parseDamagedRange, isDamaged, parseDamagedEffects, resolveActiveProfile pour profils dégradés
- parseModelDistribution: distribution des modèles par profil basée sur unitComposition
- getCombinedWeapons: combine armes attaquant + leader attaché
- ContextualSimulator: intègre profils dégradés (damagedEffects mergés), armes leader ([Leader] badge), badge "Endommagé"
- GameModePage: résout leaderDatasheet via attachedToId et le passe au simulateur
- 448 tests total, 19 nouveaux dans profileResolver, 0 régression
### File List
- src/utils/profileResolver.ts (créé)
- src/utils/profileResolver.test.ts (créé)
- src/components/domain/ContextualSimulator/ContextualSimulator.tsx (modifié — profils dégradés, armes leader)
- src/pages/GameMode/GameModePage.tsx (modifié — passe leaderDatasheet)
