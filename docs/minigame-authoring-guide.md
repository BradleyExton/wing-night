# Minigame Authoring Guide

This guide is the canonical checklist for adding a new minigame to Wing Night.
Use this to keep implementation small, modular, and compatible with current host/display flow.

## 0) Guardrails

- Server remains authoritative for state, timers, and scoring.
- Host and display render from `minigameHostView` and `minigameDisplayView`.
- Display view must never include answer/secret fields.
- Keep minigame code in `packages/minigames/<minigameId>`.

## 1) Start With a Checkpoint

- Create a checkpoint branch or commit before editing.
- Make the smallest end-to-end change that works.

## 2) Scaffold the Package

Create `packages/minigames/<slug>/` with the same shape used by existing packages:

- `src/runtime/index.ts`
- `src/client/index.ts`
- `src/client/Host<Minigame>Surface/index.tsx`
- `src/client/Host<Minigame>Surface/copy.ts`
- `src/client/Host<Minigame>Surface/styles.ts`
- `src/client/Display<Minigame>Surface/index.tsx`
- `src/client/Display<Minigame>Surface/copy.ts`
- `src/client/Display<Minigame>Surface/styles.ts`
- `src/dev/index.ts`
- `src/runtime/index.test.ts`
- `package.json`
- `tsconfig.json`
- `tsconfig.typecheck.json`

Fast path: copy `packages/minigames/geo` as a starting scaffold, then rename IDs/types.

## 3) Implement Runtime Plugin

In `packages/minigames/<slug>/src/runtime/index.ts`:

- Export a `MinigameRuntimePlugin`.
- Set `id` to your new `MinigameType`.
- Implement:
  - `initialize`
  - `reduceAction`
  - `selectHostView`
  - `selectDisplayView`
- Add `syncPendingPoints` and `syncContent` if needed.
- If content-backed, provide `content.fileName` and `parseFileContent`.

Rules:

- `selectDisplayView` must be answer-safe.
- Runtime state must be serializable.
- `reduceAction` must be no-op for invalid payloads.
- Action names are bare (unprefixed), e.g. `recordAttempt`, `setGuess`, not `geo:setGuess`. Plugin reducers narrow on their own state shape before reading `actionType`, so collisions across plugins are not a concern.

### Display view shape: one outer-union member, internal discriminant

`MinigameDisplayView` is a flat union — exactly one member per `MinigameType`. If your minigame has internal phases (e.g. guessing/submitted, idle/playing/reveal/done) where the display payload shape differs, model the variation with an **internal discriminant** on a single outer member, not by adding multiple members to the outer union:

```ts
// Yes — single outer member, internal discriminant
type GeoMinigameDisplayView = {
  minigame: "GEO";
  // shared fields
} & (
  | { status: "guessing" /* ... */ }
  | { status: "submitted"; result: { /* ... */ } }
);

// No — do not split into separate outer-union members
type GeoMinigameDisplayViewGuessing = { minigame: "GEO"; status: "guessing"; /* ... */ };
type GeoMinigameDisplayViewSubmitted = { minigame: "GEO"; status: "submitted"; /* ... */ };
```

Same rule applies to host views. Keeps `MinigameDisplayView` and `MinigameHostView` size = number of minigames.

## 4) Implement Renderer Bundle + Dev Manifest

In `packages/minigames/<slug>/src/client/index.ts`:

- Export `MinigameRendererBundle` with `HostSurface` and `DisplaySurface`.

In `packages/minigames/<slug>/src/dev/index.ts`:

- Export `MinigameDevManifest` scenarios for `/dev/minigame/:minigameId`.

## 5) Wire Shared Contracts

Update `packages/shared/src/content/gameConfig/index.ts`:

- Add the new ID to `MINIGAMES`.
- Add timer field(s) in `GameConfigTimers` and validators if needed.
- Add rules schema in `MinigameRules` and validators if needed.

Update `packages/shared/src/roomState/index.ts`:

- Add `MINIGAME_CONTRACT_METADATA_BY_ID` entry.
- Add action constants only if you want typed action names in shared contracts.

Optional stricter action typing:

- Extend `packages/shared/src/socketEvents/index.ts` typed minigame action union for new action payload shapes.

## 6) Wire Server + Client Registries

Update server registry:

- `apps/server/src/minigames/registry/index.ts`

Update client registry and slug mapping:

- `apps/client/src/minigames/registry/index.ts`

Update server minigame content loader list:

- `apps/server/src/contentLoader/loadMinigameContent/index.ts`

## 7) Wire Workspace Dependencies and Paths

Add dependency to:

- `apps/server/package.json`
- `apps/client/package.json`

Add server TS path aliases to:

- `apps/server/tsconfig.json`
- `apps/server/tsconfig.build.json`

Add package to root prebuild filters in:

- `package.json` scripts `test` and `typecheck`

## 8) Add Content and Schedule It

If content-backed:

- Add `content/sample/minigames/<slug>.json`
- Keep runtime plugin `content.fileName` in sync with actual file path.

Schedule in sample config:

- `content/sample/gameConfig.json` round `minigame` field
- Matching timer/rules fields

### 8.1 Asset hosting

Two patterns, pick by asset profile:

- **Small static images, sample/local both possible** → `apps/client/public/local-assets/<slug>/`. Reference as `/local-assets/<slug>/foo.jpg`. Used by GEO. Bundled by Next.js — no server route needed. Local overrides ship via `apps/client/public/local-assets/<slug>/` being gitignored.
- **Large or many event-specific assets (audio, video)** → Express static route. Add `app.use("/minigame-assets/<slug>", express.static("content/local/minigames/<slug>/assets"))` in `apps/server/src/index.ts`. Files live under `content/local/minigames/<slug>/assets/`. Used by Song Guess.

Server-served assets do not get bundled with the client; they stream on demand. Use this when the content is event-night-specific and shouldn't bloat the client bundle.

### 8.2 Display-side audio/video autoplay

If the display surface plays audio or video, the TV browser has had no user interaction by the time the first phase fires — `audio.play()` will be silently rejected. Pattern:

- During `MINIGAME_INTRO`, render a full-screen "Tap to enable audio" overlay on the display surface.
- On any pointer event, call `media.play().then(() => media.pause())` to prime the element, set `audioUnlocked: true` in component state, and clear the overlay.
- The host surface never needs this — its first button press is the user gesture.
- See `song-guess-spec.md` §8.1 for the canonical implementation reference.

## 9) Test Requirements

Add tests at minimum:

- Runtime/plugin tests in package (`src/runtime/index.test.ts`)
- Client/server registry tests for resolution
- Display-safe projection tests (no answer leakage)
- Any reducer validation and scoring cap behavior

Run:

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm playwright test` (when host/display sync, routing, or reconnect behavior changed)

## 10) Definition of Done

- New minigame appears in config validation and round scheduling.
- Host and display both render through package-owned surfaces.
- Server accepts actions only for active team/phase.
- Display view contains no privileged answer fields.
- Dev sandbox route works: `/dev/minigame/<slug>`.
- All required verification commands pass.
