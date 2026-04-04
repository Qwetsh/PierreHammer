# Story 9.3: Éléments personnalisés pour Pierre

Status: review

## Story

As a Pierre (destinataire du cadeau),
I want découvrir des touches personnelles cachées dans l'app,
so that je sache que cette app a été faite spécialement pour moi.

## Acceptance Criteria

1. Un splash screen personnalisé s'affiche à la première ouverture de l'app (FR38)
2. Des easter eggs personnalisés se déclenchent sur certaines interactions spécifiques (FR38)
3. Les easter eggs ne gênent pas l'utilisation normale de l'app
4. Les contenus personnalisés sont discrets mais chaleureux

## Tasks / Subtasks

- [x] Task 1 (AC: #1): Splash screen personnalisé
  - [x] src/features/personalization/components/SplashScreen.tsx
  - [x] Message personnalisé pour Pierre avec ton chaleureux
  - [x] Animations Motion: fade-in, scale, rotateY sur icône, bouton delayed
  - [x] Se déclenche une seule fois via hasSeenSplash dans preferencesStore
  - [x] Bouton "Entrer dans le Warp" pour dismiss
  - [x] Overlay z-[100], ne bloque pas le chargement de l'app
- [x] Task 2 (AC: #2, #3): Easter eggs
  - [x] src/features/personalization/utils/easterEggs.ts
  - [x] Konami code: affiche message "God mode activé..."
  - [x] Tap 5x tracker: affiche "Thin your paints !" (Duncan Rhodes)
  - [x] Pure functions, non intrusifs, suffisamment discrets
- [x] Task 3 (AC: #4): Contenus personnalisés
  - [x] Textes placeholder (Thomas personnalisera)
  - [x] Section "À propos" dans ProfilePage: "Créé avec amour par Thomas pour Pierre"
- [x] Task 4: Flag de premier lancement
  - [x] hasSeenSplash: boolean ajouté dans preferencesStore
  - [x] markSplashSeen() action
  - [x] SplashScreen intégré dans App.tsx

## Dev Notes

- **CRITICAL**: Les textes personnalisés sont des placeholders — Thomas les personnalisera avant de donner l'app à Pierre
- Le splash screen doit être émouvant mais pas trop long — 3-5 secondes max
- Les easter eggs doivent être FUN pas intrusifs — Pierre doit les découvrir naturellement
- Utiliser `motion/react` pour les animations (PAS `framer-motion`)
- Le flag hasSeenSplash persiste via Zustand persist middleware dans preferencesStore
- Composants : `export function`, named exports, PascalCase
- Pas de `any`, hooks en premier dans les composants

### References
- [Source: planning-artifacts/prd.md#FR38]
- [Source: planning-artifacts/ux-design-specification.md#Personnalisation]
- [Source: planning-artifacts/architecture.md#Features personalization]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- SplashScreen avec animations Motion, message personnalisé, bouton dismiss
- Easter eggs: Konami code + tap 5x tracker, pure functions testables
- Section "À propos" dans ProfilePage
- hasSeenSplash flag dans preferencesStore avec persist
- 3 tests SplashScreen, 4 tests easter eggs
- 157 tests passent au total, type check OK
### File List
- src/features/personalization/components/SplashScreen.tsx (créé)
- src/features/personalization/components/SplashScreen.test.tsx (créé)
- src/features/personalization/utils/easterEggs.ts (créé)
- src/features/personalization/utils/easterEggs.test.ts (créé)
- src/stores/preferencesStore.ts (modifié - hasSeenSplash + markSplashSeen)
- src/pages/Profile/ProfilePage.tsx (modifié - section À propos)
- src/App.tsx (modifié - SplashScreen)
