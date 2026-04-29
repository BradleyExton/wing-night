# GEO Minigame V1 Spec

Status: Draft  
Owner: Wing Night  
Updated: 2026-02-23

## 1) Product Direction

GEO v1 is a server-authoritative, turn-based "guess the location" minigame.

Hard constraints for v1:
- Online map interaction only (no offline map support).
- Host places a guess via clickable map.
- Ship with placeholder default locations.
- Host can add custom photos/locations through local files and local asset directories.

## 2) Gameplay (Per Team Turn)

Phase behavior follows existing room flow:
- `MINIGAME_INTRO`: show the active GEO prompt context (photo + optional hint).
- `MINIGAME_PLAY`: accept host map guess and score it.

Team-turn interaction:
1. Server selects one GEO prompt for the active team turn.
2. Host sees photo, hint, and clickable map.
3. Host clicks map to place/update guess marker.
4. Host submits guess.
5. Server computes distance and points, updates pending minigame points for the active team only.
6. Host + display show result summary (distance + points). Display remains answer-safe.

## 3) Data and Content

### 3.1 Content Files

Required default content:
- `content/sample/minigames/geo.json`

Optional host-added content:
- `content/local/minigames/geo.additions.json`

Host local images:
- `apps/client/public/local-assets/geo/*`

Image reference format:
- Local path example: `"/local-assets/geo/eiffel-tower.jpg"`
- External URL example: `"https://..."`

### 3.2 Proposed Content Schema

```json
{
  "prompts": [
    {
      "id": "geo-eiffel-01",
      "title": "City Skyline",
      "imageSrc": "/local-assets/geo/eiffel.jpg",
      "hint": "European capital",
      "answer": { "lat": 48.85837, "lng": 2.294481 },
      "credit": "Host photo"
    }
  ]
}
```

Validation rules:
- `id`, `title`, and `imageSrc` are non-empty strings.
- `answer.lat` is between `-90` and `90`.
- `answer.lng` is between `-180` and `180`.
- Prompt ids must be unique after merge.

Merge behavior:
- Start from sample prompts.
- Overlay/add prompts from local additions by `id`.
- Result is the runtime prompt pool.

## 4) Rules and Scoring

### 4.1 Game Config Extension

Extend `minigameRules`:

```ts
type GeoScoreBand = { maxKm: number; points: number };

type GeoMinigameRules = {
  scoreBandsKm?: GeoScoreBand[];
};
```

Default score bands when not configured:
- `<= 25 km`: 5 points
- `<= 100 km`: 3 points
- `<= 300 km`: 2 points
- `<= 750 km`: 1 point
- `> 750 km`: 0 points

### 4.2 Scoring Contract

- Distance computed on server with haversine.
- Award points from first matching band.
- Apply existing room cap behavior through `pointsMax`.
- Only active team can be mutated in `MINIGAME_PLAY`.

## 5) Runtime and Snapshot Contracts

### 5.1 Runtime Actions

Use generic minigame action envelope with GEO action types:
- `geo:setGuess` with payload `{ lat: number, lng: number }`
- `geo:submitGuess` with payload `{}`
- `geo:clearGuess` with payload `{}`

### 5.2 Shared View Contract Refactor

Current `MinigameHostView` and `MinigameDisplayView` are trivia-shaped.  
For GEO v1, move to discriminated unions by minigame type.

Requirements:
- Host GEO view may include answer coordinates.
- Display GEO view must not include answer coordinates or secret payloads.
- Display-safe assertions must be covered by tests.

## 6) UI/UX Surfaces

Host surface (`packages/minigames/geo/src/client/HostGeoSurface`):
- Prompt photo card.
- Hint and active team context.
- Clickable map with marker placement.
- Submit/Clear guess controls.
- Post-submit result card with distance and awarded points.

Display surface (`packages/minigames/geo/src/client/DisplayGeoSurface`):
- Prompt photo and hint.
- Status text for live guess state.
- Result summary after host submit (distance + points only).
- No answer coordinates.

## 7) Dependencies

Required for v1:
- `leaflet`
- `react-leaflet`

Not in scope for v1:
- Offline tiles/caching
- EXIF auto-ingestion
- Image processing pipeline

## 8) Planned Directory Changes

```text
packages/shared/src/content/geo/index.ts
packages/shared/src/content/geo/index.test-d.ts
packages/shared/src/content/gameConfig/index.ts
packages/shared/src/roomState/index.ts

packages/minigames/geo/src/runtime/index.ts
packages/minigames/geo/src/runtime/index.test.ts
packages/minigames/geo/src/client/HostGeoSurface/index.tsx
packages/minigames/geo/src/client/DisplayGeoSurface/index.tsx
packages/minigames/geo/src/dev/index.ts

apps/server/src/contentLoader/loadMinigameContent/index.ts
apps/server/src/roomState/index.ts
apps/server/src/roomState/scoringReset.test.ts

content/sample/minigames/geo.json
content/local/minigames/geo.additions.json (optional, gitignored)
apps/client/public/local-assets/geo/ (gitignored)
```

## 9) Implementation Plan

### Slice 1: Shared Contracts + Content Validation
- Add GEO content schema in `packages/shared`.
- Extend `gameConfig` rules with `minigameRules.geo`.
- Refactor minigame host/display view types to discriminated unions.

### Slice 2: Server Content Load + Runtime
- Add GEO runtime content adapter with parse + merge behavior.
- Implement GEO runtime reducer, scoring, and selectors.
- Wire GEO rule resolver in room state.

### Slice 3: Host/Display GEO Surfaces
- Implement clickable map host UI.
- Implement display-safe GEO display UI.
- Update GEO dev scenarios for sandbox.

### Slice 4: Hardening and Regression
- Runtime tests: scoring bands, active-team gating, invalid payloads.
- Snapshot safety tests: display view has no answer fields.
- Host/display component tests for GEO render + interactions.
- Run verification:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm playwright test` (milestone pass)

## 10) Acceptance Criteria

- If no local GEO additions exist, sample placeholder prompts are playable.
- Host can add prompts and photos via local config and local assets directory.
- Host can place guesses on clickable map and submit.
- Server computes and applies GEO points for active team only.
- Display surface remains answer-safe.
- Skip/redo/manual score override continue to work during GEO phases.
