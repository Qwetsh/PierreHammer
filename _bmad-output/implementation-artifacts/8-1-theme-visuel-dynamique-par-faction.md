# Story 8.1: Thème visuel dynamique par faction

Status: review

## Story

As a joueur,
I want que l'app change d'ambiance visuelle selon la faction consultée,
so that je sois immergé dans l'univers de ma faction.

## Acceptance Criteria

1. Couleurs, typographie display et fonds d'ambiance s'adaptent dynamiquement à la faction (FR27)
2. 6 factions avec identité visuelle complète (Space Marines/Cinzel, Orks/Black Ops One, Aeldari/Quicksand, Necrons/Orbitron, Chaos, Tyranides)
3. Transition entre factions fluide
4. L'attribut data-faction sur <html> pilote le changement

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2): Enrichir src/theme/factions.css
  - [x] 6 palettes complètes avec: primary, accent, surface, surface-alt, font-display, faction-gradient
  - [x] Gradients d'ambiance subtils (3-stop linear-gradient 135deg) par faction
- [x] Task 2 (AC: #3): Transitions CSS entre thèmes
  - [x] body transition: background-color 0.3s, color 0.3s
  - [x] prefers-reduced-motion: transition désactivée
- [x] Task 3 (AC: #4): Appliquer le thème partout
  - [x] Tous les composants utilisent les tokens CSS (--color-surface, --color-primary, etc.)
  - [x] Le changement de data-faction affecte l'app instantanément via CSS custom properties
- [x] Task 4: Enrichir les icônes/visuels par faction
  - [x] 6 icônes SVG placeholder dans public/icons/factions/ (initiales sur cercle coloré)

## Dev Notes

- Les palettes de base ont été créées dans Story 1.2 — ici on les enrichit avec des fonds d'ambiance et des détails visuels
- Les fonds d'ambiance peuvent être des gradients CSS subtils, pas besoin d'images lourdes
- Tester sur les 6 factions pour s'assurer que le contraste reste lisible
- prefers-reduced-motion: pas de transition sur les changements de couleur si activé

### References
- [Source: planning-artifacts/ux-design-specification.md#Fondation design system - Palettes de faction]
- [Source: planning-artifacts/prd.md#FR27]

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes List
- 6 palettes enrichies avec surface, surface-alt, faction-gradient (3-stop gradients)
- Transitions CSS body avec prefers-reduced-motion
- Fallback :root pour --faction-gradient et --color-surface-alt
- 6 icônes SVG placeholder créées (initiales sur cercle coloré)
- 124 tests passent, type check OK
### File List
- src/theme/factions.css (réécrit - palettes enrichies + transitions)
- public/icons/factions/space-marines.svg (créé)
- public/icons/factions/orks.svg (créé)
- public/icons/factions/aeldari.svg (créé)
- public/icons/factions/necrons.svg (créé)
- public/icons/factions/chaos.svg (créé)
- public/icons/factions/tyranids.svg (créé)
