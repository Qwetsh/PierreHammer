# Story 10.1: Intégration Supabase et authentification

Status: review

## Story

As a joueur,
I want créer un compte et me connecter à l'app,
so that mes données soient sauvegardées en ligne et accessibles depuis n'importe quel appareil.

## Acceptance Criteria

1. Le joueur peut créer un compte avec email/mot de passe
2. Le joueur peut se connecter et se déconnecter
3. L'app fonctionne toujours sans compte (mode invité / localStorage uniquement)
4. Un client Supabase est configuré et accessible dans toute l'app
5. Les variables d'environnement Supabase (URL, anon key) sont configurées
6. L'état d'authentification est géré dans un store Zustand dédié
7. Un écran de profil propose connexion/inscription ou affiche l'utilisateur connecté

## Tasks / Subtasks

- [x] Task 1 (AC: #4, #5): Setup Supabase
  - [x] Installer `@supabase/supabase-js`
  - [x] Créer `src/lib/supabase.ts` avec le client Supabase initialisé via `import.meta.env`
  - [x] Ajouter `.env.local` au `.gitignore`, créer `.env.example` avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
  - [x] Configurer le projet Supabase (auth email/password activé)
  - [x] Tests: le client Supabase s'initialise sans erreur

- [x] Task 2 (AC: #6): AuthStore Zustand
  - [x] Créer `src/stores/authStore.ts` (Zustand, PAS persist — l'état auth vient de Supabase)
  - [x] State: `user: User | null`, `loading: boolean`, `isAuthenticated: boolean`
  - [x] Actions: `initialize()` (écoute `onAuthStateChange`), `signUp(email, password)`, `signIn(email, password)`, `signOut()`
  - [x] `initialize()` appelé au montage de App.tsx
  - [x] Tests: sign up / sign in / sign out mettent à jour le state correctement (mock supabase)

- [x] Task 3 (AC: #1, #2, #7): UI Authentification
  - [x] Modifier `ProfilePage.tsx` : si non connecté → formulaire connexion/inscription ; si connecté → afficher email + bouton déconnexion
  - [x] Formulaire avec validation basique (email valide, mot de passe 6+ chars)
  - [x] Toast de succès/erreur après chaque action auth
  - [x] Tests: rendu conditionnel connecté / non connecté

- [x] Task 4 (AC: #3): Mode invité
  - [x] Si Supabase n'est pas configuré (env vars absentes) ou utilisateur non connecté, l'app fonctionne exactement comme avant (localStorage only)
  - [x] Aucune feature existante ne casse sans connexion
  - [x] Guard dans les futures features cloud : `if (!isAuthenticated) return` — pas de crash
  - [x] Tests: toutes les features existantes passent sans auth

## Dev Notes

- **CRITICAL**: Ne PAS casser le mode offline. L'app doit rester 100% fonctionnelle sans compte.
- Le client Supabase doit être un singleton importable (`src/lib/supabase.ts`)
- Pas de middleware persist sur authStore — Supabase gère ses propres tokens dans localStorage
- `onAuthStateChange` est le seul point d'entrée pour l'état auth (pas de polling)
- Composants : `export function`, named exports, pas de `any`
- Le projet Supabase doit être créé manuellement — cette story ne couvre que l'intégration côté client

### References
- Supabase Auth docs: https://supabase.com/docs/guides/auth
- Stores existants: src/stores/preferencesStore.ts (pattern à suivre pour le store)
- Page profil existante: src/pages/Profile/ProfilePage.tsx

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- Client Supabase singleton avec `isSupabaseConfigured` guard — null quand env vars absentes
- AuthStore Zustand (sans persist) avec initialize/signUp/signIn/signOut
- initialize() appelle getSession + onAuthStateChange, intégré dans App.tsx useEffect
- ProfilePage enrichi avec AuthSection conditionnelle (formulaire login/signup ou email+logout)
- Validation email regex + password 6+ chars, toast succès/erreur
- Mode invité préservé : 200 tests existants passent sans aucune régression
- TypeScript build propre (0 erreurs)
- 14 nouveaux tests (2 supabase client + 8 authStore + 4 ProfilePage)
### File List
- src/lib/supabase.ts (créé)
- src/lib/supabase.test.ts (créé)
- src/stores/authStore.ts (créé)
- src/stores/authStore.test.ts (créé)
- src/pages/Profile/ProfilePage.tsx (modifié — ajout AuthSection)
- src/pages/Profile/ProfilePage.test.tsx (créé)
- src/App.tsx (modifié — ajout useAuthStore.initialize)
- .env.example (créé)
- .gitignore (modifié — ajout .env)
- package.json (modifié — ajout @supabase/supabase-js)
