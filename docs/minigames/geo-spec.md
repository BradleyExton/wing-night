# GEO Minigame V1 Spec

Status: Ready for implementation  
Owner: Wing Night  
Updated: 2026-04-29

## 1) Product Direction

GEO v1 is a server-authoritative, turn-based "guess the location" minigame.

Hard constraints for v1:
- Online map interaction only (no offline map support).
- Active team places a guess via clickable map on the host tablet.
- Ship with placeholder default locations.
- Host can add custom photos/locations through a local content file and local asset directory.

## 2) Gameplay (Per Team Turn)

Phase behavior follows existing room flow:
- `MINIGAME_INTRO`: show the active GEO prompt photo + hint on display. Host tablet shows the same.
- `MINIGAME_PLAY`: active team receives the tablet and places guesses on the map.

Each team turn consists of **3 prompts** (configurable via `minigameRules.geo.promptsPerTurn`).

Per-prompt flow:
1. Server selects the next GEO prompt via a deterministic cursor.
2. Display screen shows the photo + hint for the whole room to see and discuss.
3. Host tablet is passed to the active team. They see the photo + hint + clickable map.
4. Team clicks the map to place/update their guess marker (clicking again overwrites).
5. Team submits the guess.
6. Server computes haversine distance and points, updates pending points for the active team only.
7. Display shows the result: photo, location name (title), both pins with a connecting line, distance, and points awarded. No answer coordinates are shown before submit.
8. Host advances to the next prompt explicitly (same control pattern as trivia).
9. After all 3 prompts, the turn ends.

### Phase timer expiry

The `MINIGAME_PLAY` phase timer (`minigameRules.geo.timerSeconds` via the existing `geoSeconds` field) is a hard wall, not a per-prompt soft cap.

If the timer expires mid-turn:
- If the active sub-state is `guessing` with no submitted guess, the in-progress prompt is **abandoned** — no points awarded, no result reveal, and the turn ends immediately.
- If the active sub-state is `submitted` (result currently visible), the turn ends after the existing reveal completes its render (server emits the standard `MINIGAME_PLAY → ROUND_RESULTS` transition).
- Remaining unplayed prompts in the turn are skipped — `promptsCompletedThisTurn` does not advance for them.

Rationale: prompts are independent score units (max 5 pts each, awarded on submit). Mid-prompt time-cuts cleanly map to "prompt skipped, no score" without partial-credit ambiguity.

## 3) Data and Content

### 3.1 Content Files

Content loading follows the same pattern as trivia — load one file, local overrides sample entirely:
- Primary (local): `content/local/minigames/geo.json` (gitignored, optional)
- Fallback (sample): `content/sample/minigames/geo.json`

Host local images:
- `apps/client/public/local-assets/geo/*` (gitignored)

Image reference format:
- Local path: `"/local-assets/geo/eiffel-tower.jpg"`
- External URL: `"https://..."`

### 3.2 Content Schema

```json
{
  "prompts": [
    {
      "id": "geo-eiffel-01",
      "title": "Eiffel Tower",
      "imageSrc": "/local-assets/geo/eiffel.jpg",
      "hint": "European capital",
      "answer": { "lat": 48.85837, "lng": 2.294481 }
    }
  ]
}
```

Required fields: `id`, `title`, `imageSrc`, `answer.lat`, `answer.lng`  
Optional fields: `hint`  
Dropped: `credit`

Validation rules:
- `id`, `title`, and `imageSrc` are non-empty strings.
- `answer.lat` is between `-90` and `90`.
- `answer.lng` is between `-180` and `180`.
- All prompt ids are unique.
- `prompts` array is non-empty.

## 4) Rules and Scoring

### 4.1 Game Config Extension

Extend `minigameRules` with `rulesKey: "geo"`:

```ts
type GeoScoreBand = { maxKm: number; points: number };

type GeoMinigameRules = {
  promptsPerTurn?: number;
  scoreBandsKm?: GeoScoreBand[];
};
```

### 4.2 Default Score Bands

Tuned for city-scale use (local landmarks and frequented spots):

| Distance | Points |
|---|---|
| ≤ 0.1 km (100 m) | 5 |
| ≤ 0.5 km | 4 |
| ≤ 2 km | 3 |
| ≤ 10 km | 2 |
| ≤ 50 km | 1 |
| > 50 km | 0 |

### 4.3 Scoring Contract

- Distance computed on server with haversine formula.
- Points awarded from first matching band.
- Points accumulate across all prompts in the turn (max 5 pts × 3 prompts = 15 pts per turn before `pointsMax` cap).
- Apply existing room cap behavior through `pointsMax`.
- Only the active team's `pendingPointsByTeamId` entry is mutated during `MINIGAME_PLAY`.

## 5) Runtime and Snapshot Contracts

### 5.1 Runtime Actions

Two actions (down from three — `clearGuess` dropped, `setGuess` overwrites in place):

- `setGuess` — payload `{ lat: number, lng: number }`. Valid only in `guessing` sub-state. Overwrites any previous marker position.
- `submitGuess` — payload `{}`. Valid only in `guessing` sub-state. Transitions to `submitted`. Locks guess and triggers scoring. All further actions silently dropped until next prompt.

Action names are bare (unprefixed) to match the trivia convention; plugin reducers narrow on their own state shape before reading `actionType`, so cross-plugin collisions are a non-issue.

### 5.2 Turn Sub-States

Within `MINIGAME_PLAY`, each prompt cycles through two sub-states:

- `guessing` — no guess or guess placed, not yet submitted. `geo:setGuess` and `geo:submitGuess` accepted.
- `submitted` — guess locked, result visible. All actions silently dropped. Host advances to next prompt via existing room flow controls.

### 5.3 GEO Runtime State Shape

```ts
type GeoPromptResult = {
  promptId: string;
  guessLat: number;
  guessLng: number;
  distanceKm: number;
  pointsAwarded: number;
};

type GeoRuntimeState = {
  promptCursor: number;
  promptsPerTurn: number;
  promptsCompletedThisTurn: number;
  currentGuess: { lat: number; lng: number } | null;
  currentSubState: "guessing" | "submitted";
  lastResult: GeoPromptResult | null;
  pendingPointsByTeamId: Record<string, number>;
  turnOrderTeamIds: string[];
  activeTurnIndex: number;
};
```

### 5.4 Shared View Contract

**`GeoMinigameHostView`** (host/active team tablet — includes answer coords):
```ts
{
  minigame: "GEO";
  activeTurnTeamId: string | null;
  pendingPointsByTeamId: Record<string, number>;
  promptsPerTurn: number;
  promptsCompletedThisTurn: number;
  currentSubState: "guessing" | "submitted";
  currentGuess: { lat: number; lng: number } | null;
  currentPrompt: { id: string; title: string; imageSrc: string; hint?: string; answerLat: number; answerLng: number } | null;
  lastResult: GeoPromptResult | null;
}
```

**`GeoMinigameDisplayView`** (answer-safe — no coords until submitted):

Single union member with an internal `status` discriminant. This matches the established flat-union pattern in `MinigameDisplayView` (one outer member per minigame) and lets clients narrow with a single switch on `status` after the existing `minigame === "GEO"` check:

```ts
type GeoMinigameDisplayView = {
  minigame: "GEO";
  activeTurnTeamId: string | null;
  pendingPointsByTeamId: Record<string, number>;
  currentPrompt: { id: string; title: string; imageSrc: string; hint?: string } | null;
} & (
  | {
      status: "guessing";
    }
  | {
      status: "submitted";
      result: {
        guessLat: number;
        guessLng: number;
        answerLat: number;
        answerLng: number;
        distanceKm: number;
        pointsAwarded: number;
      };
    }
);
```

Do **not** add separate `GeoMinigameDisplayViewGuessing` / `GeoMinigameDisplayViewSubmitted` members to the outer `MinigameDisplayView` union — that pattern multiplies as we add more minigames with internal phases (song-guess, drawing). One outer member per minigame, internal discriminant where needed.

`DisplayRoomStateSnapshot` already omits `minigameHostView` entirely — display client never sees the host view.

## 6) UI/UX Surfaces

### Host surface (`packages/minigames/geo/src/client/HostGeoSurface`)

Passed to the active team during their turn. Must be thumb-friendly.

- Prompt photo card + hint + active team name.
- Progress indicator (e.g. "Prompt 2 of 3").
- Clickable Leaflet map (OpenStreetMap tiles, no API key) with marker placement. Clicking overwrites the current marker.
- Submit button (enabled once a guess is placed).
- Post-submit: result card with distance and points awarded. Host advances to next prompt explicitly.

### Display surface (`packages/minigames/geo/src/client/DisplayGeoSurface`)

On the shared room display. Read-only.

- Prompt photo + hint. Location title is the hero text.
- During guessing: status text only, no map.
- After submit: Leaflet map showing both pins (guess + answer) with a connecting line, distance label, points awarded, and location title as the headline.

## 7) Dependencies

Required for v1:
- `leaflet`
- `react-leaflet`
- Map tiles: OpenStreetMap (no API key required)

Not in scope for v1:
- Offline tiles/caching
- EXIF auto-ingestion
- Image processing pipeline
- Per-prompt points override
- Host prompt selection / upcoming prompt preview

## 8) Directory Changes

```text
packages/shared/src/content/geo/index.ts
packages/shared/src/content/geo/index.test-d.ts
packages/shared/src/content/gameConfig/index.ts      (add rulesKey: "geo", GeoMinigameRules)
packages/shared/src/roomState/index.ts               (add GeoMinigameHostView, GeoMinigameDisplayView discriminated unions)

packages/minigames/geo/src/runtime/index.ts          (replace stub with real plugin)
packages/minigames/geo/src/runtime/index.test.ts     (real scoring + safety tests)
packages/minigames/geo/src/client/HostGeoSurface/index.tsx
packages/minigames/geo/src/client/DisplayGeoSurface/index.tsx
packages/minigames/geo/src/dev/index.ts              (real dev scenarios)

apps/server/src/contentLoader/loadMinigameContent/index.ts   (add GEO content loader)
apps/server/src/roomState/index.ts                           (wire GEO rule resolver)

content/sample/minigames/geo.json
apps/client/public/local-assets/geo/                 (gitignored)
content/local/minigames/geo.additions.json           (removed — not needed, local overrides sample)
```

## 9) Implementation Plan

### Slice 1: Shared Contracts + Content Schema
- Add GEO content schema and validation in `packages/shared/src/content/geo`.
- Extend `gameConfig` with `GeoMinigameRules` and `rulesKey: "geo"`.
- Add `GeoMinigameHostView` and `GeoMinigameDisplayView` discriminated unions to `roomState`.

### Slice 2: Server Content Load + Runtime
- Add `content/sample/minigames/geo.json` with placeholder prompts.
- Wire GEO content loader in `loadMinigameContent` (same `loadContentFileWithFallback` pattern as trivia).
- Implement GEO runtime plugin: state machine, haversine scoring, action reducer, view selectors.
- Wire GEO rule resolver in server room state.

### Slice 3: Host/Display GEO Surfaces
- Implement `HostGeoSurface` with Leaflet map, marker placement, submit flow, result card, progress indicator.
- Implement `DisplayGeoSurface` with photo/hint view and post-submit dual-pin map with result.
- Update GEO dev scenarios for sandbox.

### Slice 4: Hardening and Regression
- Runtime tests: scoring bands, active-team gating, sub-state transitions, invalid payloads.
- Display view safety tests: no answer coords in `guessing` status.
- Host/display component tests for GEO render + interactions.
- Run verification:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm playwright test` (milestone pass)

## 10) Acceptance Criteria

- If no local GEO content exists, sample placeholder prompts are playable.
- Host can add custom prompts and photos via local content file and local assets directory.
- Active team places guess on Leaflet map (OpenStreetMap tiles), overwrites freely until submit.
- Server computes haversine distance and awards points from configured score bands.
- Server applies GEO points to active team only.
- Display surface shows no answer coordinates before submit.
- Display surface shows both pins, connecting line, distance, and location title after submit.
- 3 prompts per turn by default; configurable via `minigameRules.geo.promptsPerTurn`.
- Skip/redo/manual score override continue to work during GEO phases.

## 11) V2 Backlog

- Per-prompt difficulty / points override.
- Host prompt selection and upcoming prompt preview.
- Offline tile caching.
- EXIF auto-ingestion from photo files.
