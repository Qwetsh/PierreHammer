# Story 6.3: Mode offline avec Service Worker (PWA)

Status: review

## Story

As a joueur,
I want utiliser l'app entièrement sans connexion internet après le premier chargement,
so that je puisse consulter mes listes et ma collection même sans réseau.

## Acceptance Criteria

1. App fonctionne 100% offline: navigation, consultation, modification (FR34, NFR7)
2. vite-plugin-pwa cache app shell et données de jeu avec stratégie cache-first
3. Service worker sert la version correcte des données (NFR10)
4. App installable comme PWA sur l'écran d'accueil
5. Chargement initial < 3s sur 4G (NFR1)
6. Bundle applicatif < 2 Mo hors données JSON (NFR6)

## Tasks / Subtasks

- [x] Task 1 (AC: #2, #3): Configurer vite-plugin-pwa dans vite.config.ts
  - [x] registerType: 'autoUpdate'
  - [x] workbox.globPatterns: ['**/*.{js,css,html,svg,woff2}']
  - [x] workbox.runtimeCaching: cache-first pour /data/*.json (données de jeu)
  - [x] Cache images Wahapedia avec stratégie CacheFirst + expiration 30 jours
- [x] Task 2 (AC: #4): Configurer le PWA manifest
  - [x] Manifest via vite-plugin-pwa config: name "PierreHammer", short_name "PH", display "standalone"
  - [x] Couleurs: theme_color et background_color matching le dark mode (#0f0f1a)
  - [x] Icônes: placeholder SVG 192x192 et 512x512 (à remplacer avec de vraies icônes plus tard)
- [ ] Task 3 (AC: #1): Tester le mode offline
  - [ ] Charger l'app une fois avec connexion
  - [ ] Couper le réseau (DevTools > Network > Offline)
  - [ ] Vérifier: navigation fonctionne, données de jeu affichées, collection modifiable
- [x] Task 4 (AC: #5, #6): Audit de performance
  - [x] Vérifier la taille du bundle avec `npm run build` + analyser dist/
  - [x] Bundle JS ~427 KB (gzip ~132 KB) — bien sous 2 Mo
  - [x] Code splitting actif, lazy loading des pages, tree shaking OK

## Dev Notes

- CRITICAL: vite-plugin-pwa gère automatiquement le service worker via Workbox. Pas besoin d'écrire un SW custom
- La stratégie cache-first signifie: servir depuis le cache d'abord, puis mettre à jour en arrière-plan
- Les données JSON de jeu (factions.json, space-marines.json, etc.) sont dans public/data/ et seront pré-cachées
- registerType 'autoUpdate' met à jour le SW silencieusement — pas de prompt "nouvelle version disponible"
- Les images Wahapedia (Phase 2) seront cachées via runtimeCaching avec CacheFirst

### References
- [Source: planning-artifacts/architecture.md#Infrastructure & Deployment - PWA Cache]
- [Source: planning-artifacts/prd.md#NFR1, NFR6, NFR7, NFR10]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- vite-plugin-pwa configuré avec registerType autoUpdate, globPatterns, runtimeCaching (game-data + wahapedia-images)
- Manifest PWA inline dans vite.config.ts (pas de fichier séparé, vite-plugin-pwa le génère)
- Icônes SVG placeholder créées (192 et 512), à remplacer par de vraies icônes PNG
- Build prod: 427 KB JS total (gzip 132 KB), PWA 26 entries pré-cachées (434 KB)
- Task 3 (test offline) à valider manuellement par l'utilisateur
### File List
- vite.config.ts (modifié - config PWA complète)
- public/icons/icon-192.svg (créé)
- public/icons/icon-512.svg (créé)
