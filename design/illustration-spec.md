# Illustration Spec

## 1. Purpose

This file defines the locked illustration system for this project.
It is the single source of truth for illustration style, composition, color usage, prompt structure, and iteration rules.

All image prompts should be assembled from this file to prevent aesthetic drift and reduce prompt back-and-forth.

## 2. Style System (LOCKED)

- Flat vector only
- Clean geometric shapes
- Crisp edges
- No photorealism
- No textures/grain/noise
- No gradients that reduce readability
- No tiny decorative details
- Keep silhouettes readable at distance and thumbnail scale

Default operating profile:

- Primary illustration type: `mixed` (hero + card workflows)
- Default background mode: `solid` (icons can use `transparent`)
- Default stroke baseline: `2px`
- Default corner radius set: `0`, `8`, `16`, `24`

## 3. Measurable Constraints

- Max distinct shapes: `15`
- Minimum element size: `3%` of canvas height
- Max accent color usage: `10%` of visible area
- Red-family usage: semantic heat/danger moments only (`heat`, `danger`)

Stroke consistency rules:

- Use one stroke family per illustration
- Keep stroke thickness visually consistent across objects
- Default stroke target is `2px` unless a specific asset calls for a documented override
- Do not mix heavy outlines with hairline details in one composition

Corner radius consistency rules:

- Use one radius family per illustration
- Default set is `0`, `8`, `16`, `24`
- Do not mix sharp and ultra-rounded corners without explicit intent

## 4. Composition Rules

- One focal cluster per composition
- Subject should fill `60%` to `70%` of frame
- Keep generous outer padding (about `10%` to `14%` frame edge)
- Default to centered composition
- No cluttered micro-clusters
- Preserve strong silhouette readability at distance

## 5. Color System

Canonical palette (from project tokens):

- `bg`: `#121212`
- `surface`: `#1C1C1C`
- `surfaceAlt`: `#242424`
- `text`: `#FFFFFF`
- `muted`: `#A3A3A3`
- `primary`: `#F97316`
- `heat`: `#EF4444`
- `success`: `#22C55E`
- `danger`: `#DC2626`
- `gold`: `#FBBF24`

Semantic mapping:

- Primary = emphasis and key focal anchors
- Secondary surfaces = structure/depth grouping
- Accent = high-energy highlights (bounded by accent cap)
- Heat/Danger red = escalation/heat only
- Gold = winner/celebration moments only

Palette constraints:

- Do not introduce new colors during iteration unless explicitly requested
- Use at most two accents in one asset

## 6. Variation Protocol

First pass should request multiple structured compositions before refinement:

- A) Symmetrical layout
- B) Dynamic diagonal
- C) Minimal
- D) Energetic but clean

Variation-first policy:

- Generate 3-4 variants first
- Choose one base variant
- Move to diff-only iteration

## 7. Diff-Only Iteration Protocol

All refinements after first pass must be diff-only.

Rules:

- Do not restate full prompt
- List only explicit changes
- Do not alter locked system block
- Do not introduce new colors
- Do not change layout structure unless requested

Preferred format:

Use Variation [X] as base.

Diff v[n]:
- [measurable change]
- [measurable change]
- [measurable change]

Do not alter locked illustration system.
Do not introduce new colors.
Do not modify layout unless specified.

## 8. Prompt Assembly Instructions

Every prompt must be assembled in this order:

1. Locked System Block
2. Scene Brief
3. Variation Request
4. Output Constraints

Prompt header text:

Use the locked illustration system below. Do not modify it.

Required output constraints each time:

- Aspect ratio
- Exact size
- Background mode (solid/transparent)
- No text
- No logos

## 9. Export Conventions

Naming pattern:

`{project}-{assetType}-{sceneSlug}-v{nn}-{theme}-{width}x{height}.{png|svg}`

Examples:

- `wing-night-hero-round-intro-v01-dark-1920x1080.png`
- `wing-night-card-team-loop-v02-dark-1200x900.png`
- `wing-night-icon-heat-v01-transparent-512x512.svg`

Folder mapping:

- Hero assets: `/assets/illustrations/hero/`
- Card assets: `/assets/illustrations/cards/`
- Icon assets: `/assets/illustrations/icons/`

Background handling:

- Default hero/card = solid
- Icons may use transparent background
- Always state background mode explicitly in prompt output constraints

Hero vs card defaults:

- Hero: stronger focal subject, wider visual pacing
- Card: simpler framing, reduced detail density

## 10. Future-Proofing Note

If this workflow migrates to API-based generation later:

- This markdown spec can be converted to structured JSON
- Prompt assembly can move into a backend function
- Diff-iteration logic remains identical

## 11. Why This Exists

This system exists to:

- Reduce typical iteration loops (8-10) down to 2-3
- Prevent aesthetic drift across assets
- Maintain visual consistency across frontend surfaces
- Make image generation feel like component development
- Keep the workflow dev-native, file-based, and versionable
