# Story 10.3: Système d'amis et listes partagées

Status: review

## Story

As a joueur connecté,
I want ajouter des amis et voir leurs listes d'armée publiques,
so that je sache ce que mon adversaire aligne avant une partie.

## Acceptance Criteria

1. Le joueur peut rechercher d'autres utilisateurs par email ou pseudo
2. Le joueur peut envoyer une demande d'ami
3. Le joueur peut accepter ou refuser une demande d'ami
4. Le joueur peut voir la liste de ses amis
5. Le joueur peut voir les listes publiques de ses amis (lecture seule)
6. Le joueur peut rendre ses propres listes publiques ou privées
7. Une page "Amis" est accessible depuis la navigation

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2, #3, #4): Schéma DB amis
  - [x] Table `profiles` (extension de auth.users) :
    ```sql
    create table profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      username text unique,
      created_at timestamptz default now()
    );
    ```
  - [x] Table `friendships` :
    ```sql
    create table friendships (
      id uuid primary key default gen_random_uuid(),
      requester_id uuid references profiles(id) on delete cascade,
      addressee_id uuid references profiles(id) on delete cascade,
      status text not null check (status in ('pending', 'accepted', 'rejected')),
      created_at timestamptz default now(),
      unique(requester_id, addressee_id)
    );
    ```
  - [x] RLS: un utilisateur voit ses propres friendships, peut insérer en tant que requester
  - [x] Trigger : créer un profil automatiquement à l'inscription (via auth.users trigger)
  - [x] Tests: RLS empêche l'accès aux friendships d'un autre utilisateur (10 tests)

- [x] Task 2 (AC: #1, #2, #3, #4): FriendsService
  - [x] Créer `src/services/friendsService.ts`
  - [x] `searchUsers(query)` : recherche par username (ilike)
  - [x] `sendFriendRequest(requesterId, addresseeId)` : insert dans friendships avec status 'pending'
  - [x] `respondToRequest(friendshipId, accept: boolean)` : update status
  - [x] `getFriends(userId)` : friendships avec status 'accepted'
  - [x] `getPendingRequests(userId)` : friendships reçues avec status 'pending'
  - [x] `removeFriend(friendshipId)` : delete
  - [x] `updateUsername(userId, username)` + `getProfile(userId)` : bonus pour Task 6
  - [x] Tests: 11 tests avec mock Supabase (proxy thenable+chainable)

- [x] Task 3 (AC: #4, #7): FriendsStore et page Amis
  - [x] Créer `src/stores/friendsStore.ts` (Zustand, PAS persist)
  - [x] State: `friends[]`, `pendingRequests[]`, `profile`, `searchResults`, `loading`, `searching`
  - [x] Actions: wrappent le FriendsService + mettent à jour le state
  - [x] Créer `src/pages/Friends/FriendsPage.tsx`
  - [x] UI : liste d'amis, badge de demandes en attente, barre de recherche utilisateur avec debounce
  - [x] Ajouter route `/friends` et `/friends/:friendId/lists` dans App.tsx
  - [x] Ajouter onglet "Amis" dans BottomNav (visible uniquement si connecté, authOnly flag)
  - [x] Tests: 6 tests store (load, search, sendRequest, remove, updateUsername, auth guard)

- [x] Task 4 (AC: #5): Consultation des listes d'amis
  - [x] Dans FriendsPage, cliquer sur un ami ouvre ses listes publiques
  - [x] Créer `src/pages/Friends/FriendListsPage.tsx` — affiche les listes publiques (lecture seule)
  - [x] Route `/friends/:friendId/lists`
  - [x] Les listes affichent les mêmes infos que ListsPage (nom, faction, points, nombre d'unités)
  - [x] Cliquer sur une liste navigue vers le détail
  - [x] Utilise fetchPublicLists + getProfile du service existant

- [x] Task 5 (AC: #6): Toggle public/privé sur les listes
  - [x] Bouton toggle 🔓/🔒 dans ListDetailPage (visible si authenticated + remoteId)
  - [x] Met à jour `isPublic` via listsStore.updateList + listsSyncService.setListPublic
  - [x] `isPublic` déjà dans ArmyList type (Story 10.2), ajouté à updateList signature
  - [x] Icône cadenas 🔓/🔒 sur ListsPage à côté du badge cloud
  - [x] Tests existants couvrent le updateList

- [x] Task 6: Choix du pseudo à l'inscription
  - [x] Champ pseudo ajouté au formulaire d'inscription (ProfilePage AuthSection)
  - [x] Validation client: regex /^[a-zA-Z0-9_-]{3,20}$/ avec message d'erreur inline
  - [x] updateUsername appelé après signUp pour enregistrer dans profiles
  - [x] Affichage + édition du pseudo dans ProfilePage (section Compte)
  - [x] Pseudo affiché dans FriendsPage (via friendsStore.profile + friendship profiles)

## Dev Notes

- **CRITICAL**: Les listes privées ne doivent JAMAIS être visibles par d'autres utilisateurs — les RLS Supabase sont la ligne de défense
- Le trigger pour créer le profil à l'inscription est un `after insert on auth.users` SQL function
- La recherche par username utilise `ilike` pour être case-insensitive
- Pas de système de notifications push pour les demandes d'ami — polling simple au chargement de FriendsPage
- L'onglet "Amis" dans BottomNav n'apparaît que si l'utilisateur est connecté — pas de changement pour le mode invité

### References
- authStore: src/stores/authStore.ts (Story 10.1)
- listsSyncService: src/services/listsSyncService.ts (Story 10.2)
- BottomNav: src/components/ui/BottomNav/BottomNav.tsx
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- Migration SQL: profiles table (extends auth.users) + friendships table + RLS + auto-profile trigger + indexes
- friendsService: 8 methods (searchUsers, sendFriendRequest, respondToRequest, getFriends, getPendingRequests, removeFriend, updateUsername, getProfile) + error handling
- friendsStore: Zustand store wrapping service + auth guard + self-exclusion in search
- FriendsPage: recherche debounced, demandes en attente, liste d'amis avec navigation vers listes
- FriendListsPage: affichage read-only des listes publiques d'un ami
- BottomNav: onglet "Amis" conditionnel (authOnly flag)
- ListDetailPage: toggle public/privé (🔓/🔒) si authenticated + remoteId
- ListsPage: icône cadenas à côté du badge cloud
- ProfilePage: champ pseudo à l'inscription + affichage/édition pseudo pour utilisateurs connectés
- listsStore.updateList: signature étendue pour inclure isPublic
- 243 tests total, 27 nouveaux (10 SQL + 11 friendsService + 6 friendsStore), 0 régression
### File List
- supabase/migrations/20260421_create_profiles_and_friendships.sql (créé)
- supabase/migrations/20260421_create_profiles_and_friendships.test.ts (créé)
- src/services/friendsService.ts (créé)
- src/services/friendsService.test.ts (créé)
- src/stores/friendsStore.ts (créé)
- src/stores/friendsStore.test.ts (créé)
- src/pages/Friends/FriendsPage.tsx (créé)
- src/pages/Friends/FriendListsPage.tsx (créé)
- src/components/ui/BottomNav/BottomNav.tsx (modifié — onglet Amis conditionnel)
- src/App.tsx (modifié — routes /friends et /friends/:friendId/lists)
- src/pages/Lists/ListDetailPage.tsx (modifié — toggle public/privé)
- src/pages/Lists/ListsPage.tsx (modifié — icône cadenas)
- src/pages/Profile/ProfilePage.tsx (modifié — pseudo inscription + édition)
- src/stores/listsStore.ts (modifié — isPublic dans updateList signature)
