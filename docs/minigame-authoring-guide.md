# Minigame Authoring Guide

This guide is the canonical checklist for adding a new minigame to Wing Night.
Use this to keep implementation small, modular, and compatible with current host/display flow.

## 0) Guardrails

- Before any of this: the game has passed the review in
  [minigame-design-principles.md](minigame-design-principles.md) §11. This guide makes a
  game run; that file is what makes it worth running.
- Server remains authoritative for state, timers, and scoring.
- Host and display render from `minigameHostView` and `minigameDisplayView`.
- Display view must never include answer/secret fields.
- Keep minigame code in `packages/minigames/<slug>`.
- The host drives every phase. Nothing auto-advances, and no minigame ends its
  own turn on a clock.
- Escape hatches are never removed: the host can always skip, redo and manually
  override score (`AGENTS.md` §11). During the takeover they live behind the
  corner dock, not on your canvas.
- New host controls go through the override surface, not inline phase chrome
  (`SPEC.md:380`). A minigame's `actions` row is the *turn's* controls, not the
  room's.
- Touch targets stay 44x44 CSS px or larger (`SPEC.md`, "Interaction and
  Accessibility") — including in `actions`, where the dock gutter has already
  taken 72px of the row's width.

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
   - `package.json` (main/`.` and `./runtime` point at `src/runtime/index.ts`; `./client`, `./dev` subpaths;
     `"@wingnight/surface": "workspace:*"` for the takeover layouts, `@wingnight/cast` if you draw a bird), `tsconfig.json`
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

Both surfaces in that bundle are house components, and the host one also has an
anatomy. 4.1–4.7 are what an author has to *do*; `DESIGN.md` §2.0B is why, and
`docs/takeover-layout-api.md` is the contract with the arithmetic.

### 4.1 House component idiom

`packages/minigames/*/src/client/**` is governed by the same lint rules as
`apps/client/src/components` (`eslint.config.mjs`). It was not when most of the
nine were written, which is why the older surfaces do not all look like this:

- A component is a folder with `index.tsx`, a colocated `styles.ts` imported as
  `import * as styles from "./styles.js"`, and a `copy.ts` for every
  user-facing string. **The `.js` suffix is not optional inside a package** —
  the packages resolve as ESM while `apps/client` does not (which writes
  `"./styles"`), so a component copied out of the app arrives with the wrong
  import form.
- Semantic style keys (`container`, `body`, `actions`), never a `ClassName` suffix.
- `index.tsx` caps at 260 lines, `styles.ts` at 140. Both are errors, not warnings.
- No inline `style` prop, no hardcoded JSX text, no `*.json` imports.
- No hex colours and no raw Tailwind palette names in a `styles.ts` — only
  `bg surface surfaceAlt text muted primary heat success danger gold teamA-teamH`,
  plus `mutedWarm`, `mutedWarmDim` and `ember`. **Lint does not yet catch this in
  your package**: the three colour rules gate on the marker list in
  `tools/eslint-plugin-wingnight/rules/houseComponentPaths.mjs`, which is
  `apps/client/src/components/`, `packages/cast/src/` and `packages/surface/src/`
  — the minigame trees join it with the hex migration (BACKLOG). Write it right
  anyway. A green lint is not a licence.

### 4.2 Choosing a takeover layout

At `MINIGAME_PLAY` the shell collapses its control deck and your host surface
owns the canvas — but **it does not stop rendering the room's context**. The
mini-rail, the play clock and the corner dock stay the shell's, along with the
bottom-right gutter and the z-index budget, because both are properties of the
canvas rather than of any game. You own the body, and the turn's own counts and
controls.

`packages/surface` exports two layouts, and you choose by rendering one — there
is no flag between them (ADR-0002 guardrail 2), so a layout change shows up in a
diff as the structural change it is:

```tsx
import { TakeoverCanvas, TakeoverStage } from "@wingnight/surface";
```

**The rule is about covering, not about size.** Use `<TakeoverCanvas>` when
chrome can float over the body without hiding something the host must read or
press; use `<TakeoverStage>` when it cannot. The mechanical test: is the body's
meaning spread evenly across it — a map, an arena, a corridor, a zone, where a
chip in one corner costs a corner of scenery — or concentrated in one place — a
question, a picture frame, an emoji grid, a song console, where a chip covers a
word?

Two precedents, both measured rather than guessed, and both worth knowing before
reaching for the bigger number:

- **DRAWING has the largest body of the nine and is still a Stage.** Full bleed
  was measured at **78.3%** of the tablet against the Stage's **59.1%**, and
  refused: a floating `actions` row for DRAWING is five buttons — undo, clear,
  skip, correct, incorrect — and under 4.5's pointer rule a button takes the
  pointer for being a button. That is ~700x44px of the picture the TV is
  mirroring gone dead to ink, with CLEAR under the artist's moving hand.
  Nineteen points is what the covering rule costs there, and it is worth paying.
- **SONG_GUESS refused the Canvas on the shape of the slots.** A Canvas has
  exactly two floating slots, `actions` and `readout`, **both on the same edge**,
  each bounded at `calc(100%-4.5rem)`. SONG_GUESS's host surface is nine tap
  targets (play/pause, replay, skip, reveal, title ✓✗, artist ✓✗, next) plus a
  `RunningTotals` panel, and there is nowhere on one edge to put them. It is a
  Stage — and it dropped its deck anyway. Layout and deck are separate axes.

Today: Stage for TRIVIA, DRAWING, EMOJI_CHARADES, RECREATE and SONG_GUESS;
Canvas for GEO, JOUST, FAPPY and SCHLONIC. Read one of each before writing
yours — `packages/minigames/trivia/src/client/HostTriviaSurface/index.tsx` is
the smallest Stage, `packages/minigames/geo/src/client/HostGeoSurface/index.tsx`
the reference Canvas.

### 4.3 What the shell hands you, and what you must forward

From `MinigameHostRendererProps` (`packages/minigames/core/src/index.ts`):

- **`rail` and `clock` are shell-owned nodes. Forward them untouched into the
  layout's `rail` and `clock` slots, always, on every play beat.** Never draw a
  rail of your own; never wrap the rail slot in a second `<header>` or `<nav>`
  (the rail is the only host `<header>` carrying round/sauce/team text, and the
  e2e suite locates it that way); never drop `clock` because your game has
  `timerKey: null`. `<TakeoverTimerChip />` renders nothing in that case, and an
  unfilled slot in a flex row costs no width — that is the whole mechanism that
  abolished nine hand-typed top-right reserves, five of which held 192px for a
  clock that never drew. Both props are `null` on the intro beat, which is a
  panel in the host's own control deck rather than a takeover; that is the one
  place you render neither.
- **`activeTeamName` is authoritative. Never write a local
  `resolveActiveTeamName`.** The shell resolves it once with the rail's own
  precedence (`selectHeaderContext`: the turn's team, else the round's), so the
  string on your props and the string in the rail are the same string. All nine
  packages used to carry that helper because the shell passed the *round's* team
  where every game wanted the *turn's*; it is fixed at the source and there are
  now zero copies in the repo. Do not render the name as chrome — the rail says
  it, and saying it twice on one canvas is the duplication the anatomy exists to
  end — but a sentence that needs the name may use it.
- `teamNameByTeamId` is what `RunningTotals` takes. `serverOrigin` is `null`
  until the host app resolves it in an effect (see 5.1 and 5.3).

### 4.4 What goes in which slot

`DESIGN.md` §2.0B has the full map and the reasoning. The short form:

- **`rail`, `clock`** — shell. Forwarded, never drawn, never wrapped.
- **`counter`** — yours, **read-only**: the turn's live counts, between the rail
  and the clock. "Photo 2 of 3", "Shot 2 of 5", "+3 pending". **No tap targets** —
  a control here sits beside the clock, which is exactly where a host will not
  look for it. It may not repeat the team name or the minigame name.
- **`children`** — the body, everything the host reads. The layout gives it
  `relative isolate`. It may **not** hold a control that reaches the
  bottom-right corner; that is the rule that fixed TRIVIA's `INCORRECT` and
  RECREATE's `Next target`, both of which sat under the dock as the last flow
  child of a body with no reserve.
- **`deck`** (Stage only, optional) — a `clamp(230px,28vw,330px)` scrolling right
  column. It has exactly one call site, EMOJI_CHARADES, whose picker cells are
  `aspect-square` so a wider body holds *fewer* of them. Assume you do not want one.
- **`actions`** (optional) — everything that ends a beat. Full-width foot row on
  a Stage; floating bottom-left on a Canvas, together with the hint that explains
  it, where it costs the arena no height at all. **The positive verdict comes first.**
- **`readout`** (Canvas only, optional) — the turn's numbers, floating
  bottom-right *above* the dock, where the host's eye already is after a result:
  distance and points, the last shot's score, `RunningTotals`.

**There is no bottom-right slot for a control.** That corner is the dock's, and
the dock does exactly two things: end the turn and open overrides. A game that
wants a button there has misread the phase — at `MINIGAME_PLAY` the tablet is in
the players' hands.

### 4.5 Traps that actually caught people

- **Never hand-type a dock gutter.** If you are typing `4.5rem` into a game's
  `styles.ts`, you have taken a wrong turn. The layouts own the reserve and apply
  it in five places; `packages/surface` deliberately exports no token for it, and
  `packages/surface/src/index.test.ts` asserts that no export name matches
  `/gutter|dock|reserve/i`. Handing the number out is how a tenth reserve gets
  written.
- **`position: fixed` does not work in the takeover.** The dev sandbox renders
  the host shell inside a CSS-scaled device frame, and a transformed ancestor
  captures fixed positioning — so a fixed element pins to the frame rather than
  to the tablet, and the surface looks right everywhere except where it is
  judged. Position `absolute` inside the body instead: it is a stacking context,
  so any z-index you like — Leaflet's own 400–1000 included — is sandboxed by
  geometry and cannot reach the shell's chrome or the dock.
- **Pointer events belong to controls, not to children.** A Canvas's floating
  rows are `pointer-events-none` and hand the pointer back with
  `[&_:is(button,a,input,select,textarea)]:pointer-events-auto`. A passive
  `<div>` or `<span>` in `actions` does **not** take the pointer, and that is
  deliberate: under the old every-direct-child rule FAPPY shipped a hint sentence
  that killed 764x48px of a corridor where a tap means flap — 4.0% of it — and
  the game could not opt out, because a plain `pointer-events-none` on the span
  is inert against the layout's rule (equal specificity, ordered later). Group
  your controls in a wrapper if you like; the selector matches descendants.
- **Tailwind never generates a class from an interpolated fragment.**
  `` `text-${tone}-500` `` produces no CSS at all. Enumerate literal class strings
  and pick between them. `apps/client/tailwind.config.ts` scans
  `packages/minigames/*/src/**/*.{ts,tsx}`, so a new minigame package is covered
  the moment it exists — but only for classes that appear literally in the source.
- **Quote your `tsx --test` globs.** Unquoted, the shell expands them and the
  walk stops at two directory levels, so a deep colocated test never runs and the
  suite goes green having tested nothing. Copy the line verbatim from a sibling
  package: `"test": "tsx --tsconfig ../../../tsconfig.tsx-runtime.json --test
  \"src/**/*.test.ts\" \"src/**/*.test.tsx\""`.

### 4.6 Judging it: the sandbox, and measuring your canvas share

`/dev/minigame/<slug>` drives your real reducer through the real host shell and
previews the tablet at **1280x800** (`HOST_DEVICE` in
`apps/client/src/components/MinigameDevSandbox/SandboxStage/index.tsx`), which is
the party's actual Android tablet. It is the judging instrument, and two things
lie in it:

- **`vw`/`vh` resolve against the browser viewport, not the scaled device box.**
  Every clamp reads wrong unless the browser is pinned to exactly 1280x800.
- **A hidden pane never fires `ResizeObserver`.** Anything that sizes itself from
  one — a self-sizing `<canvas>`, for instance — sits at its default 300x150 and
  looks like a bug that is not there. Front the pane before trusting it.

To measure the share of the tablet your body actually gets: pin the browser to
exactly 1280x800, front the pane, and read **`offsetWidth`/`offsetHeight`** —
never `getBoundingClientRect()`, which returns post-transform numbers in a
CSS-scaled frame and will report your element far smaller than it is. Divide by
the 1,024,000px² device box. The ledger to measure against is in
`docs/host-surface-consolidation-plan.md`: a Canvas game lands at ~89.9%, a Stage
between 59.1% and 82.5%.

Then prove the corner **behaviourally**, not just geometrically:
`document.elementFromPoint` at the dock circle's centre must return the dock, and
at your nearest control's own edge must return your control. TRIVIA's collision
sat latent because the sample question is short enough to miss it.

### 4.7 When to share, and when not to

You are writing the tenth game with nine to copy from, and the temptation is to
hoist whatever looks alike. The bar is ADR-0002's: **three or more call sites
with identical semantics**, no behaviour-switch props, no multi-flag
configuration objects. Applied to this canvas it produced two layouts, one
component and a set of tokens — plus five refusals recorded in `DESIGN.md`
§2.0B, which are as much a part of the anatomy as the slots.

**The pattern to carry: share the thing that would drift dangerously, refuse the
thing that merely looks alike.**

- `RunningTotals` was shared across four games because four copies of a scoring
  panel will eventually disagree about a number — and it paid for itself at once
  by exposing a bug none of the four could see from inside a 330px deck: the row
  had `justify-between` and no gap, so floated at content width in a Canvas
  `readout` a team's name met its points at a measured 0px ("Honky Tonk Heat0
  pts"). The shared row takes `gap-4`.
- The three history strips were refused: three call sites but three *shapes*, and
  collapsing them needs `items` + `renderItem` + `isActive` + `padTo` + `tone` —
  the configuration object the ADR forbids, or a render prop wearing a hat.
- The arena frame was refused at what looked like three call sites, because one
  of the three only coincidentally resembles the other two, and the residue was
  six utilities and no structure.

Note the second finding from `RunningTotals` before you hoist anything: the
"house card" three games shared turned out to be written in JOUST's private
dusk-desert hexes, and had to be re-expressed in house tokens value for value
before it could move, because a `styles.ts` under `packages/surface/src` may not
carry a raw hex. An abstraction is not free just because the strings match.

## 5) Content and Assets

If content-backed:

- Add `content/sample/minigames/<slug>.json` matching the plugin's
  `content.fileName`.
- Loading order stays `<root>/local/` → `<root>/sample/` → the repo's
  `content/sample/` and is handled by the generic loader — no loader edits. The
  root is the night pack when one exists (see CLAUDE.md).

### 5.1 Asset hosting

Two patterns, pick by asset profile:

- **Static images (real ones)** → `<root>/local/assets/<slug>/`, referenced pack-relative as
  `<slug>/foo.jpg` with NO leading slash, and resolved in the surface with
  `resolveContentAssetSrc(src, serverOrigin)`. The server already serves the whole
  `assets/` tree at `CONTENT_ASSET_ROUTE_PATH`, so a new game needs no new route. Used by GEO.
  Committed placeholder art is the exception: it stays in `apps/client/public/sample-assets/<slug>/`
  and is referenced with a leading slash, which the resolver passes through untouched.

For GEO, `pnpm import:geo <photo-folder>` turns GPS-tagged JPEGs into prompts: it reads each photo's EXIF location as the answer, writes a resized metadata-stripped copy to `<pack>/local/assets/geo/`, and appends entries to `<pack>/local/minigames/geo.json` (edit titles/hints/`featuredPlayers` there afterwards — see 5.2).
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

  Declare the route path as a constant in `packages/shared` and import it from **both** the mount and whatever builds the client-side URL, so the two cannot drift and a rename is a typecheck failure rather than a silent 404. Used by team anthems (`TEAM_AUDIO_ROUTE_PATH`), the lobby playlist (`LOBBY_AUDIO_ROUTE_PATH`) and Song Guess.

  **The client-side URL must be absolute.** There is no `vite.config` anywhere in this repo, so there is no dev proxy and the client is always a different origin from the server — a root-relative `src="/team-audio/x.mp3"` resolves against the Vite origin (5173 dev, 5273 under the e2e gate) and 404s. Build it from `apps/client/src/utils/resolveServerOrigin`, and read the origin **inside an effect**, never at module or render scope, which `react-dom/server` cannot do.

Server-served assets do not get bundled with the client; they stream on demand. Use this when the content is event-night-specific and shouldn't bloat the client bundle.

### 5.2 Tagging prompts with the people in them

Any prompt in any bank may carry `featuredPlayers` — the names of the people
who appear in it:

```json
{ "id": "geo-back-deck", "title": "Back Deck", "imageSrc": "geo/back-deck.jpg",
  "featuredPlayers": ["Alex", "Jordan"], "answer": { "lat": 43.65, "lng": -79.38 } }
```

`loadContent` drops prompts nobody on tonight's roster appears in, before room
state or any runtime sees them. The rules:

- **Names, not player ids.** `loadPlayers` derives ids positionally
  (`player-${index + 1}`), so an id is a statement about an array position, not
  a person — reordering `players.json` would silently re-point every tag.
  Matching is case- and whitespace-insensitive against `players.json`.
- **Any, not all.** A prompt survives if *one* tagged player is on the roster,
  so a group photo still plays when one of four people didn't come.
- **Untagged means always shown.** A missing or empty `featuredPlayers` is
  never filtered — which is why `import:geo` can safely emit `[]` for a human
  to fill in later, and why the sample packs are unaffected.
- **Unknown names are warned about, not errors.** A name matching nobody is
  either a no-show or a typo, and only the host can tell which; the loader
  prints both the unknown names and the hidden-prompt count at boot. A pack
  that filters to nothing warns loudly and still boots.
- **Malformed tags fail the parse.** `featuredPlayers` that isn't an array of
  names throws at load with the prompt index, rather than degrading into an
  untagged prompt that survives every roster.

Carried through `createPromptContentAdapter`, so every prompt bank — current
and future — gets this without touching its own `clonePrompt`.

### 5.3 Display-side audio/video autoplay

If the display surface plays audio or video, the TV browser has had no user interaction by the time the first phase fires — `audio.play()` will be silently rejected. Pattern:

- The overlay already exists: `DisplayBoard/AudioUnlockOverlay`, built for team
  anthems and now also shown at `SETUP` when the lobby playlist has tracks. It
  primes the element on any pointer event — `play()` followed by a SYNCHRONOUS
  `pause()`, never one chained onto the play promise, or the priming pause lands
  after the cue that same tap triggers and kills the music a beat after it
  starts — sets session-scoped `audioUnlocked` state, and clears: once a night,
  not once a round.
- To opt your game in, set `requiresDisplayAudio: true` on its
  `MinigameRendererBundle`. `DisplayBoard` asks the registry, so the overlay also
  appears for a round whose active team has no anthem. Do not add a second primer.
- Your display surface owns its own `<audio>` element and drives it in effects.
  Render the element for the whole surface lifetime, not per phase, so seeking
  never has to re-create it mid-round. Every media call is best-effort — a
  rejected `play()` must never throw or stall a phase advance.
- The `src` must be absolute. Take the origin from the `serverOrigin` renderer
  prop (the client app resolves it in an effect, so it is `null` on first paint)
  and build the URL with a pure helper — see
  `packages/minigames/song-guess/src/client/resolveSongAudioSrc`.
- The host surface never needs this — its first button press is the user gesture.
- See `packages/minigames/song-guess/src/client/useSongAudioPlayback` for the
  worked implementation, and `song-guess-spec.md` §0 for what it settled.

## 6) Test Requirements

Add tests at minimum:

- Runtime/plugin tests in package (`src/runtime/index.test.ts`)
- Display-safe projection tests (no answer leakage)
- Any reducer validation and scoring cap behavior
- Surface tests colocated as `index.test.tsx` beside each `index.tsx`
- The existing client/server registry tests iterate `MINIGAME_TYPES` and cover
  your game automatically once it is registered.

The idiom is `node:test` + `node:assert/strict` + `renderToStaticMarkup`,
asserted with regexes against an HTML string. There is no Vitest, no jsdom and
no Testing Library in this repo, whatever `AGENTS.md` §9 says. Name tests
`does X when Y`, and remember the assertions run against **escaped** HTML —
`/Frank&#x27;s/`, not `/Frank's/`. Quote the `tsx --test` globs in your
`package.json` (4.5) or the deep ones never run.

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

Host takeover, additionally:

- The play beat renders `<TakeoverStage>` or `<TakeoverCanvas>`, and forwards
  `rail` and `clock` into their slots untouched — including when the clock draws
  nothing.
- No `resolveActiveTeamName`, no rail of its own, no team name as chrome.
- No `4.5rem` and no `position: fixed` anywhere in the game's `styles.ts`; no
  z-index reaching outside the body.
- No control in `counter`, and nothing reaching the bottom-right corner.
- Measured in `/dev/minigame/<slug>` with the browser at a true 1280x800 and the
  pane fronted, and the dock corner proved with `elementFromPoint` (4.6).
