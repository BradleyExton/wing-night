# Minigame Authoring Guide

This guide is the canonical checklist for adding a new minigame to Wing Night.
Use this to keep implementation small, modular, and compatible with current host/display flow.

## 0) Guardrails

- Server remains authoritative for state, timers, and scoring.
- Host and display render from `minigameHostView` and `minigameDisplayView`.
- Display view must never include answer/secret fields.
- Keep minigame code in `packages/minigames/<slug>`.

## 1) The Discovery Invariant

Shared registration lives in one place: `MINIGAME_DEFINITIONS` in
`packages/shared/src/content/gameConfig/index.ts`. Adding an entry there
extends `MinigameType`, and **every `Record<MinigameType, ...>` map in the
repo then fails to compile until your new game is registered in it**:

- `apps/server/src/minigames/registry/index.ts` — runtime plugin map (1 line)
- `apps/client/src/minigames/registry/index.ts` — renderer bundle + dev manifest + runtime plugin (1 entry)
- `apps/client/src/copy/minigameBriefings.ts` — display intro briefing copy (1 entry)

You cannot forget a registration: `pnpm typecheck` walks you to each one.
Timer and rules config keys are also derived from `MINIGAME_DEFINITIONS`
(`timerKey`, `rulesKey`), so no timer/rules type edits are needed anywhere.

## 2) End-State Checklist: Files for a New Minigame

For a content-backed game with the slug `<slug>`:

1. `packages/minigames/<slug>/` — new package (scaffold by copying `packages/minigames/geo`):
   - `package.json` (main/`.` and `./runtime` point at `src/runtime/index.ts`; `./client`, `./dev` subpaths), `tsconfig.json`
   - `src/runtime/index.ts` — the `MinigameRuntimePlugin`
   - `src/runtime/{types,guards,rules,views,content}/index.ts` as needed
   - `src/runtime/index.test.ts`
   - `src/client/index.ts` + `Host<Name>Surface/` + `Display<Name>Surface/`
   - `src/dev/index.ts` — `createDevManifest({ rules, content })`
2. `packages/shared/src/content/<slug>/index.ts` — content-file types + guards
   (`<Name>ContentFile`, `is<Name>ContentFile`, `is<Name>Prompt`), exported from
   `packages/shared/src/index.ts`.
3. `packages/shared/src/content/gameConfig/index.ts` — one `MINIGAME_DEFINITIONS`
   entry (`id`, `slug`, `timerKey`, `rulesKey`, `contractMetadata`).
4. `packages/shared/src/roomState/index.ts` — host/display view types added to the
   `MinigameHostView` / `MinigameDisplayView` unions.
5. `apps/server/src/minigames/registry/index.ts` — one registry line.
6. `apps/client/src/minigames/registry/index.ts` — one registry entry.
7. `apps/client/src/copy/minigameBriefings.ts` — one briefing entry.
8. `apps/server/package.json` + `apps/client/package.json` — workspace dependency
   on `@wingnight/minigames-<slug>` (packages run from source; there is no build
   step and no path-alias or prebuild wiring).
9. `content/sample/minigames/<slug>.json` — sample content, plus scheduling in
   `content/sample/gameConfig.json` (round `minigame` field and a
   `<slug>Seconds` timer value; rules under `minigameRules.<slug>` if used).

The server content loader (`apps/server/src/contentLoader/loadMinigameContent`)
is generic: it iterates every registered plugin and loads `content.fileName`
declared by the plugin. It needs no edits for a new game.

## 3) Implement the Runtime Plugin

In `packages/minigames/<slug>/src/runtime/index.ts`, export a
`MinigameRuntimePlugin`:

- `id`: your new `MinigameType`.
- `initialize`, `reduceAction`, `selectHostView`, `selectDisplayView`.
- `syncPendingPoints` and `syncContent` if needed.
- `content`: build it with `createPromptContentAdapter` from
  `@wingnight/minigames-core` — pass `label`, `fileName`, an
  `invalidContentHint` error suffix, plus your shared `isContentFile` /
  `isPrompt` guards and a `clonePrompt`. You get `parseFileContent` (strict,
  used by the server content loader) and `resolveContent` (lenient, used at
  runtime) for free.
- `isRules` (optional): schema guard for `gameConfig.minigameRules.<rulesKey>`.
  The server calls it while loading `gameConfig.json`, so invalid rules still
  block game start with a clear error (AGENTS.md §8). Omit it if your game has
  no rules (`rulesKey: null` in the definition).

Rules:

- `selectDisplayView` must be answer-safe.
- Runtime state must be serializable.
- `reduceAction` must be a no-op (`didMutate: false`) for invalid payloads.
- Action names are bare (unprefixed), e.g. `recordAttempt`, `setGuess`, not
  `geo:setGuess`. Plugin reducers narrow on their own state shape before
  reading `actionType`, so collisions across plugins are not a concern.

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

- Export a `MinigameRendererBundle` with `HostSurface` and `DisplaySurface`.

In `packages/minigames/<slug>/src/dev/index.ts`:

- Export the manifest for `/dev/minigame/<slug>`:
  `createDevManifest({ rules, content })` supplies the standard two-team
  fixture (`team-alpha`/`team-beta`, `pointsMax: 15`); you provide only the
  game-specific `rules` and `content` literals, mirroring `content/sample/`
  so sandbox play matches a real night. (Keep them literals — packages do not
  import JSON across package boundaries.)
- The sandbox boots `initialize` with that fixture and plays your real
  reducer live — there are no hand-authored view models or canned states.

## 5) Content and Assets

If content-backed:

- Add `content/sample/minigames/<slug>.json` matching the plugin's
  `content.fileName`.
- Loading order stays `content/local/` → `content/sample/` and is handled by
  the generic loader — no loader edits.

### 5.1 Asset hosting

Two patterns, pick by asset profile:

- **Small static images, sample/local both possible** → `apps/client/public/local-assets/<slug>/`. Reference as `/local-assets/<slug>/foo.jpg`. Used by GEO. Bundled by the client build — no server route needed. Local overrides ship via `apps/client/public/local-assets/<slug>/` being gitignored.

For GEO, `pnpm import:geo <photo-folder>` turns GPS-tagged JPEGs into prompts: it reads each photo's EXIF location as the answer, writes a resized metadata-stripped copy to `local-assets/geo/`, and appends entries to `content/local/minigames/geo.json` (edit titles/hints there afterwards).
- **Large or many event-specific assets (audio, video)** → Express static route, mounted in **`apps/server/src/createApp`** (not `index.ts`), resolving **absolute** paths from the content root:

  ```ts
  // inside createApp, where `contentRootDir` is the injectable option that
  // defaults to resolveContentRootDir()
  app.use(
    ASSET_ROUTE_PATH,
    express.static(resolve(contentRootDir, "local", "teams", "audio"))
  );
  app.use(
    ASSET_ROUTE_PATH,
    express.static(resolve(contentRootDir, "sample", "teams", "audio"))
  );
  ```

  Three things this gets right that a bare `express.static("content/...")` in `index.ts` does not:

  - **Absolute, not cwd-relative.** The server's dev script is `tsx watch src/index.ts` run with cwd `apps/server`, so a relative string resolves to `apps/server/content/…` — the wrong tree.
  - **Resolved from the content root at call time.** `resolveContentRootDir()` reads `WN_CONTENT_ROOT_DIR`, which the e2e stack points at its own seeded root; a hardcoded path serves the wrong content under the gate.
  - **`createApp` has a test seam; `index.ts` does not.** Mounting there is what lets a colocated test boot on port 0 against a tmpdir root and assert the route actually serves.

  Mount **local first, then sample**, mirroring `loadContentFileWithFallback`'s local-wins fallback: `express.static` defaults to `fallthrough: true`, so a miss — or an absent `local/` directory — falls through to the sample mount and then to a 404. Path traversal is handled for you.

  Declare the route path as a constant in `packages/shared` and import it from **both** the mount and whatever builds the client-side URL, so the two cannot drift and a rename is a typecheck failure rather than a silent 404. Used by team anthems (`TEAM_AUDIO_ROUTE_PATH`) and Song Guess.

  **The client-side URL must be absolute.** There is no `vite.config` anywhere in this repo, so there is no dev proxy and the client is always a different origin from the server — a root-relative `src="/team-audio/x.mp3"` resolves against the Vite origin (5173 dev, 5273 under the e2e gate) and 404s. Build it from `apps/client/src/utils/resolveServerOrigin`, and read the origin **inside an effect**, never at module or render scope, which `react-dom/server` cannot do.

Server-served assets do not get bundled with the client; they stream on demand. Use this when the content is event-night-specific and shouldn't bloat the client bundle.

### 5.2 Display-side audio/video autoplay

If the display surface plays audio or video, the TV browser has had no user interaction by the time the first phase fires — `audio.play()` will be silently rejected. Pattern:

- During `MINIGAME_INTRO`, render a full-screen "Tap to enable audio" overlay on the display surface.
- On any pointer event, call `media.play().then(() => media.pause())` to prime the element, set `audioUnlocked: true` in component state, and clear the overlay.
- The host surface never needs this — its first button press is the user gesture.
- See `song-guess-spec.md` §8.1 for the canonical implementation reference.

## 6) Test Requirements

Add tests at minimum:

- Runtime/plugin tests in package (`src/runtime/index.test.ts`)
- Display-safe projection tests (no answer leakage)
- Any reducer validation and scoring cap behavior
- The existing client/server registry tests iterate `MINIGAME_TYPES` and cover
  your game automatically once it is registered.

Run:

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm playwright test` (when host/display sync, routing, or reconnect behavior changed)

## 7) Definition of Done

- `pnpm typecheck` passes — which proves every `Record<MinigameType, ...>`
  registration exists.
- New minigame appears in config validation and round scheduling.
- Host and display both render through package-owned surfaces.
- Server accepts actions only for active team/phase.
- Display view contains no privileged answer fields.
- Dev sandbox route works: `/dev/minigame/<slug>`.
- All required verification commands pass.
