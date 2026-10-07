# AGENTS.md

This document defines engineering standards and guardrails for Wing Night.

Codex and contributors must follow these rules when generating or modifying code.

If a change violates these constraints, it should be refactored before merging.

---

# 1) Codex-First Workflow (Required)

Codex should optimize for small, verifiable changes.

## 1.1 Task Execution Loop
For each task:
1. Read the relevant sections of `SPEC.md`.
2. Make the smallest change that satisfies the task.
3. Add/update tests as required.
4. Run the appropriate verification commands.
5. Ensure the change is modular and follows repo conventions.

## 1.2 Checkpoints
Before starting a task, create a clean checkpoint (git commit or stash).  
After completing a task, ensure the repo is in a working state and tests pass.

## 1.3 Verification Commands (Default)
- Unit/component tests: `pnpm test`
- E2E tests: `pnpm playwright test`
- Typecheck (if present): `pnpm typecheck`
- Lint (if present): `pnpm lint`

Run:
- `pnpm test` for any shared/game-logic changes.
- `pnpm playwright test` only for milestone tasks affecting host/display sync, routing, or reconnect behavior.

---

# 2) Architecture Principles

- Server is authoritative for all game state.
- Clients render state and request mutations only.
- No client-side derived game logic that can diverge from server truth.
- Realtime sync via Socket.IO.
- Clients must rehydrate from full state snapshot on connect/reconnect.
- In-memory state only (MVP).

---

# 3) Monorepo Structure

- Project uses pnpm workspace monorepo.
- Shared contracts and validation live in `packages/shared`.
- Client and server must import types from `packages/shared`.
- Do not duplicate state types in client or server.

## 3.1 Minigame Boundary Rules

- Minigame engine contracts live in `packages/minigames/core`.
- Concrete minigames live in subdirectories of `packages/minigames` other than `core` (for example `packages/minigames/<minigameId>`). For the current iteration, minigame renderer modules are React-first.
- Server adapters/projections for minigames live under `apps/server/src/minigames/**`.
- Presentation both the app and minigame packages draw lives in a package, never in `apps/client`: the character cast and the team look in `packages/cast` (`@wingnight/cast`), the host/display design system — style tokens, `<TakeoverStage>`, `<TakeoverCanvas>`, `RunningTotals` — in `packages/surface` (`@wingnight/surface`), and the sound — the one AudioContext, the `sfx`/`voice` buses, the tone and noise voices, the cue-table board and the house cues — in `packages/audio` (`@wingnight/audio`). A game with sounds of its own is a cue table on that board (FAPPY's `audio/`), never a second AudioContext. Minigame packages never import from `apps/client`; if a minigame needs something the app draws, it moves into one of those first. Three mechanisms enforce the ban and none of them is a convention: `apps/client/package.json` declares no `main`/`types`/`exports`, `tsconfig.base.json` declares no `paths`, and no minigame package declares the dependency.
- Display-facing minigame view contracts (for example `selectDisplayView`) must never include answer/secret fields; only host views may include privileged fields. Do not add answer fields to shared snapshot display-view contracts until host-only filtering or secret channels are implemented.

## 3.2 Minigame Projection Guardrails

- Server-owned projections are the only source for `minigameHostView` and `minigameDisplayView` snapshot fields; clients must not assemble or derive these view models.
- Host-only answer/secret payloads must stay in server runtime state and host projections only; never copy privileged fields into display-facing snapshot contracts.
- Any minigame projection change must include tests asserting display-safe payloads remain answer-free.

## 3.3 The One Display-Reported Event

Three seats connect: HOST (the tablet), DISPLAY (the TV) and PLAYER (a guest's phone, §3.4).
Every client→server event from a host or a display that mutates the room carries a `hostSecret`
and runs a host-authorized mutation, with exactly one exception: `music:trackEnded`. The display
owns the room's single `<audio>` element, so the display is the only client that can know a track
finished — and the lobby playlist has to advance on its own or the music dies after track one.

The rules that keep this from eroding "the display is read-only" (SPEC.md §1):

- It is a REPORT, not a command. The payload names the `source` and `trackIndex` that just ended,
  and `reportRoomMusicTrackEnded` ignores it unless that is still the track the room believes is
  playing. A replay, a stale report from a reconnected display, and a second display reporting the
  same track are all no-ops.
- It may only ever touch `musicPlayback`. Nothing reachable from a display-reported event may
  advance a phase, move a turn cursor or change a score.
- It is accepted only from a display on the laptop. The server registers the listener only on a
  socket seated as DISPLAY whose handshake was loopback (`isLoopbackPeer`: loopback address, a
  loopback Host header, and a loopback Origin or none), because the laptop is what drives the TV.
  A display opened on a guest's phone over the Wi-Fi may watch, but it gets no say in the music,
  and a HOST socket has no listener for the report at all.
- It stays alone. A second display-reported event needs a decision in `AGENTS.md`, not a second
  entry in `REPORTED_EVENTS` — the exception is defensible precisely because it is one.

Music playback itself is server-authoritative like `timer`: the display renders `musicPlayback` and
derives nothing. A cue that decides what should be playing from `phase` is a bug.

## 3.4 The PLAYER Seat (Guest Phones)

A guest's phone connects as `PLAYER` with
`auth = { clientRole: "PLAYER", joinToken, claimSecret? }`. The seat guard
(`socketServer/seatGuard`) seats it on the current join token OR a live claim secret (so phones
already holding a face survive a new code), and refuses anything else with the connect error
`player_auth_required` — never downgraded to DISPLAY, the same rule HOST has with
`host_auth_required`.

- **Secrets live in one place.** The join token and every claim secret live only in the
  server's claim store (`apps/server/src/playerClaims`). `RoomState` carries ids alone —
  `claimedPlayerIds` and `connectedPlayerIds` — so no snapshot to any role can seat a phone.
  The join token reaches the TV over `display:playerJoinToken`, emitted only to DISPLAY sockets
  whose handshake was loopback (the laptop drives the TV): on connect, on every rotation, and
  in answer to `display:requestPlayerJoinToken`, a read the laptop's display makes when its
  listener attaches late. A display on the Wi-Fi has no listener for the ask and never
  receives the token.
- **Its own allow-list.** A phone's snapshot is `PLAYER_SAFE_ROOM_STATE_KEYS`, built key by key
  — never the display's list minus a key. It never carries `minigameHostView`, `gameConfig`,
  the playlists or (for now) `minigameDisplayView`; a game's phone surface adds exactly the
  fields it needs. Anything only one player may see goes over that player's own room
  (`player:<id>`) as its own event (`player:self` today), never into the shared snapshot.
- **One holder per room.** `player:<id>` only ever contains the socket the store says holds
  that face. Every path that ends a claim the holder did not end itself — host free, roster
  prune, reset, the same secret on another socket, "this isn't me" from another tab, another
  face claimed from the same Wi-Fi address — announces it, and the socket layer sends the
  holder `player:claimGone { playerId, reason }` and removes it from the room.
- **The phone family.** `player:claim { playerId, claimSecret? }` and `player:release
  { claimSecret }` are registered only on PLAYER sockets, answer on a Socket.IO ack (so a claim
  secret goes back to the one socket that asked), and share a per-socket token bucket
  (`rate_limited` when spent). Claiming a face another phone holds is refused; claiming your
  own (same socket or same secret) is idempotent; claiming a second face releases the first,
  and so does a claim from the same non-loopback address. A phone reconnecting with its secret
  is re-bound before its first paint. Claim-flag broadcasts are coalesced to one per 100 ms.
- **The host's controls.** `setup:releasePlayerClaim` frees one face and
  `setup:rotatePlayerJoinToken` prints a new join code without touching claims (unseated phone
  sockets are dropped; seated ones stay). Both are host-authorized and accepted in any phase;
  the tablet shows them on the SETUP Players list only.
- **Ids are positional.** Every site that rewrites `players` prunes the claim store:
  `resetGameToSetup` and `resetRoomState` clear every claim and rotate the join token (which
  drops every PLAYER socket); `setRoomStatePlayers` (content reload), `startQuickPlay` and
  `setRoomStateFatalError` drop a claim whose id is gone or now names somebody else (name and
  `avatarSrc` both compared). A new player-rewrite site must prune too.
- **A phone is not a host.** Nothing a PLAYER socket can send may advance a phase, move a turn
  cursor or change a score. When a later feature routes a contestant's turn to their phone,
  that needs its own entry here, the way `music:trackEnded` has §3.3.

---

# 4) Component & Utility Structure

- Components and utilities must be small and focused.
- Each component/util lives in its own descriptive folder.
- Use `index.tsx` for components.
- Use `index.ts` for utilities.
- Tests live alongside implementation as `index.test.ts` or `index.test.tsx`.
- Styles must be in `styles.ts` and imported into components.
- Component entry files must import styles via namespace: `import * as styles from "./styles"`.
- Export semantic style keys from `styles.ts` (for example `container`, `heading`, `card`), not `*ClassName`-suffixed names.
- If a util is only used by one component, it may live inside that component’s folder.
- Subcomponents follow the same modular structure.

Everything must remain modular and composable.

## 4.1 UI Decomposition Guardrails (Required)

- `index.tsx` files under `apps/client/src/components/**` should stay under ~220 lines; hard cap is 260 lines unless explicitly allowlisted in lint config.
- `styles.ts` files under `apps/client/src/components/**` should stay under 140 lines.
- If a component renders phase-specific surfaces (for example setup/eating/results), each phase surface should be extracted to a subcomponent once the parent file approaches the cap.
- New UI tasks must not add another major section into an already over-cap component without an accompanying extraction.
- When touching a large component, leave it more modular than you found it (extract at least one coherent subcomponent when practical).

PR expectation for UI changes:
- Include a short "Component map" in the PR description listing parent component + extracted subcomponents.
- Add/adjust tests at the extracted component boundary (not only at the monolithic parent).

---

# 5) Naming Conventions

- Components: PascalCase
- Hooks: useSomething
- Utilities: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Socket events: domain:action (example: game:nextPhase)

Prefer `type` over `interface` unless declaration merging is required.

---

# 6) State Rules

- Single source of truth: server RoomState.
- Client stores only snapshot + local UI state.
- No recalculating scores client-side.
- No hidden derived state.

## 6.1 Team-Turn Contract

- Round execution is per-team: `MINIGAME_INTRO -> EATING -> MINIGAME_PLAY -> TURN_RESULTS` repeats for each team before `ROUND_RESULTS`.
- `RoomState` team-turn fields (`turnOrderTeamIds`, `roundTurnCursor`, `activeRoundTeamId`, `completedRoundTurnTeamIds`, `activeTurnTeamId`) are server-authored snapshot contract fields. `activeTurnTeamId` is minigame turn state used by minigame UI surfaces and must never be client-authored.
- EATING participation and minigame score mutations must be accepted for the active team only.
- Round points are accumulated across team turns and applied once when entering `ROUND_RESULTS`.

---

# 7) Timers

- Timers must live on server.
- Timer state must include `endsAt` timestamp.
- Client renders countdown but does not control timer truth.

---

# 8) Content Packs

- Content loads via a single contentLoader module.
- Loading order: `<root>/local/` → `<root>/sample/`, and for the night pack alone, the repo's
  committed `content/sample/` as a floor.
- The root is resolved once, by `resolveContentRootDir`: `WN_CONTENT_ROOT_DIR` if set, else the
  night pack at `~/wing-night-content` if it exists, else the repo's `content/`. Never re-derive it.
- The night pack lives OUTSIDE the repo so every worktree shares one copy of gitignored party
  content. See CLAUDE.md for its layout.
- Images in content (`avatarSrc`, GEO `imageSrc`) are pack-relative with no leading slash and are
  served by the SERVER at `CONTENT_ASSET_ROUTE_PATH`; resolve them with `resolveContentAssetSrc`,
  never by interpolating the route. Real assets do not live in the client's `public/` directory —
  the client and server are separate origins, so a root-relative asset URL 404s on the TV.
- All content must be validated before game start.
- Invalid content blocks start with clear error.
- Never scatter direct JSON loads across components.

---

# 9) Testing Standards

Unit Tests (Vitest):
- Scoring logic
- Game state transitions
- Content validation
- Config parsing

E2E Tests (Playwright):
- Host ↔ Display sync
- Phase transitions
- Refresh rehydrate behavior

Avoid flaky timing-based tests.
Mock timers where possible.

---

# 10) Error Handling

- Use centralized logger utility.
- Log phase transitions and score mutations on server.
- Display must never crash on recoverable errors.
- Fatal content errors should block game start clearly.

---

# 11) Escape Hatch Rule

For any new feature or mini-game:
- Host must be able to skip.
- Host must be able to redo.
- Host must be able to manually override score.

Never remove escape hatches.

---

# 12) TypeScript Rules

- `strict: true`
- No `any` (use `unknown` + validation).
- Use `satisfies` for config objects.
- Shared schemas live in `packages/shared`.

---

# 13) Dependency Discipline

- No new dependency without justification.
- Prefer standard library and small utilities.
- If adding dependency, document reason in PR.

---

# 14) Code Philosophy

- Keep functions pure where possible.
- Prefer small, testable units.
- Avoid deep nesting and large files.
- Optimize for clarity over cleverness.
- Avoid premature abstraction.
- Build for party reliability first.

---

# 15) UI Copy Rules

- Do not hardcode user-facing copy directly inside components.
- For component-specific text, colocate copy in the component folder as `copy.ts`.
- For shared text, use typed feature modules under `apps/client/src/copy/` (for example `host.ts`, `display.ts`, `common.ts`).
- Components should remain presentational and consume copy values via imports.
- Structure copy modules so future i18n integration can be added without rewriting component logic.

---

# 16) UI Theme Rules

- For any client UI styling change, read `DESIGN.md` first and use its canonical semantic color tokens.
- Use Tailwind theme token classes from `apps/client/tailwind.config.ts` in component `styles.ts` files.
- Do not hardcode colours — hex, `rgb()`, `rgba()`, `hsl()` — in a house `styles.ts` or in `packages/surface/src/styleTokens/index.ts`. The house trees are `apps/client/src/components/**`, `packages/cast/src/**`, `packages/scenery/src/**`, `packages/surface/src/**` and the minigame packages, as `tools/eslint-plugin-wingnight/rules/houseComponentPaths.mjs` marks them. A token colour that needs an alpha inside an arbitrary value is `theme(colors.gold/35%)`. Scene art that `DESIGN.md` licenses to carry its own palette lives in a `palette.ts` or in a `scene*`-named export, which the rule exempts by name.
- For Host and display surfaces, prefer the shared design system exported from `packages/surface` (`@wingnight/surface`) — the style tokens (mini-rail, stage hero, deck row, CTA + heat strip, the marquee strings) and the takeover layouts — over re-implementing the same shapes. **This rule and §3.1's ban on importing `apps/client` used to contradict each other**, because the tokens lived at `apps/client/src/components/HostControlPanel/styleTokens/` where no minigame could reach them; a minigame surface could obey one or the other and not both, which is why nine of them invented a takeover anatomy apiece. The tokens are in a package now and both rules hold at once. See `DESIGN.md` §2.0A for the host shell's anatomy and §2.0B for the takeover's.

---

Wing Night is optimized for real-world playtesting.

Stability > cleverness.  
Clarity > complexity.  
Fun > perfection.
