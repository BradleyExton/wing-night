# Wing Night — SPEC (House Party MVP)

---

## 0) Purpose

Wing Night is a host-led, in-person party game inspired by spicy wing challenges and game-show mini-games.

Teams eat progressively hotter wings across multiple rounds. Immediately after eating, teams compete in a turn-based mini-game while dealing with the spice.

The experience is:
- Social-first
- Fast-paced
- Host-driven
- Spectator-friendly
- Designed for one living room setup

UI consistency and surface constraints are defined in `DESIGN.md`.
Engineering rules are defined in `AGENTS.md`.

If it is not defined in this document, it is not MVP scope.

---

## 1) MVP Constraints

- One implicit game room only
- No room codes
- No player phone join flow
- Two screens:
  - Host UI (tablet-optimized)
  - Display UI (TV-optimized, HDMI laptop)
- Display must:
  - Be read-only
  - Never scroll vertically
  - Fill the viewport (`100dvh` / no overflow)
- All devices run on the same local Wi-Fi network (LAN-first)
- Server holds authoritative state (in-memory only)
- Host-driven phase progression (never auto-advance)
- Turn-based mini-games only (one team at a time)
- Escape hatches always available (skip, redo, manual scoring)

Out of Scope (MVP):
- Multiple rooms
- Accounts/auth system
- Persistent database
- Cloud deployment
- Image uploads
- AI features
- Multiple config selection

---

## 2) Party Setup

- 12–20 players
- 3–5 teams
- Players are preloaded from JSON
- Teams are formed live at the party
- Team sizes are locked once the game starts

Display runs on a laptop connected to a TV via HDMI and must remain full-screen and scroll-free.

---

## 3) Content Packs (Engine vs Content Separation)

Wing Night separates engine from custom content.

### Loading Priority

1. `content/local/` (gitignored)
2. Fallback to `content/sample/` (committed)

If local content is missing, sample content must allow the game to run.

---

### 3.1 Players Preset

Loaded from:

- `content/local/players.json`
- fallback: `content/sample/players.json`

Format:

{
  "players": [
    { "name": "Brad", "avatarSrc": "/local-assets/avatars/brad.jpg" },
    { "name": "Mike" }
  ]
}

Rules:
- `name` required
- `avatarSrc` optional
- Missing avatar → initials fallback
- Teams formed in SETUP
- Teams lock when game starts

---

### 3.2 Game Configuration (Data-Driven Rounds)

Loaded from:

- `content/local/gameConfig.json`
- fallback: `content/sample/gameConfig.json`

Example:

{
  "name": "House Party Pack",
  "rounds": [
    {
      "round": 1,
      "label": "Warm Up",
      "sauce": "Frank’s",
      "pointsPerPlayer": 2,
      "minigame": "TRIVIA"
    }
  ],
  "minigameScoring": {
    "defaultMax": 15,
    "finalRoundMax": 20
  },
  "timers": {
    "eatingSeconds": 120,
    "triviaSeconds": 30,
    "geoSeconds": 45,
    "drawingSeconds": 60
  }
}

Rules:
- Exactly one active config file
- Each round must define `minigame`
- Config locks once game starts
- Invalid config blocks start

---

### 3.3 Mini-Game Content

Prompts load from:
- `trivia.json`
- `geo.json`
- `drawing.json`

Local static assets:
- `client/public/local-assets/` (gitignored)

Images may reference:
- Local static paths (preferred)
- External URLs (allowed)

### 3.4 Mini-Game Module Boundary

- Mini-game rules run behind a module boundary under `packages/minigames/*`.
- The room engine drives phase lifecycle, timers, and score application.
- Mini-game modules provide serializable state reducers/selectors and package-owned host/display renderer surfaces.
- Server projects module selectors into snapshot-safe views:
  - `minigameHostView` for host interaction context.
  - `minigameDisplayView` for display-safe context (no answer payloads).
- Host and display surfaces render from projected view models, not client-derived mini-game logic.
- For this iteration, minigame renderers are React-first and loaded from package client exports.
- Minigame authoring/iteration uses `/dev/minigame/:minigameId` sandbox route to preview host/display surfaces without running full game flow.

---

## 4) Game Flow (State Machine)

Global Phases:

1. SETUP
2. INTRO
3. ROUND_INTRO
4. EATING
5. MINIGAME_INTRO
6. MINIGAME_PLAY
7. ROUND_RESULTS
8. FINAL_RESULTS

Rounds 1–N repeat phases 3–7 with a per-team loop:
- `ROUND_INTRO` (once per round)
- `EATING -> MINIGAME_INTRO -> MINIGAME_PLAY` (once per team, in fixed turn order)
- `ROUND_RESULTS` (once after the last team turn in the round)

---

## 5) Phase Definitions

### SETUP
Host:
- Load players
- Create teams
- Assign players
- Start game (disabled until valid)

Display:
- Idle screen

---

### ROUND_INTRO
Display:
- Round number
- Label
- Sauce
- Standings

Host advances → EATING

---

### EATING
Host:
- Record per-player participation for the active team only
- Pause/extend timer
- Active team (team name only; no turn-progress label)

Display:
- Active team (team name only; no turn-progress label)
- Dominant eating timer countdown

Wing points are accumulated in pending round totals but NOT applied yet.

---

### MINIGAME_INTRO
Display:
- Mini-game title
- Short instructions
- Active team (team name only; no turn-progress label)

---

### MINIGAME_PLAY (Turn-Based)

- One active team turn at a time
- Fixed round turn order for the game
- Mini-game scoring mutations are accepted for the active team only
- PASS_AND_PLAY hides host controls
- Host unlock via press-and-hold
- Server snapshot carries `minigameHostView` and `minigameDisplayView` for this phase.
- Host and display surfaces show active team context (team name only) based on snapshot active-team fields (`activeRoundTeamId`, `activeTurnTeamId`).
- Display surface remains answer-safe (no secret answer payloads).

---

### ROUND_RESULTS
Display:
- Wing points
- Mini-game points
- Updated totals

At this phase:
- Apply accumulated round points (wing + mini-game) to total scores

---

### FINAL_RESULTS
Display:
- Winner highlight
- Final standings

Tie → Sudden death trivia.

---

### Host Override Access (Tablet UX)

Goal:
- Keep escape hatches immediately reachable without permanently occupying primary phase layouts.

Entry Point:
- Host UI exposes a persistent `Overrides` trigger in the bottom-right corner.
- Trigger remains visible in all host gameplay phases (`ROUND_INTRO`, `EATING`, `MINIGAME_INTRO`, `MINIGAME_PLAY`, `ROUND_RESULTS`, `FINAL_RESULTS`).
- Trigger shows a visible active-state indicator when any override has pending or non-default state.

Surface Behavior:
- Default override surface is a right-anchored slide-in panel (non-blocking to the main host context).
- On tablet and larger host layouts, panel opens as a side sheet over the current phase view.
- On narrower host layouts, override surface may switch to a full-height sheet while preserving identical controls and behavior.
- Modal dialogs are reserved for high-risk confirmations only (for example redo/skip/reset confirmation), not for the full override workspace.

Override Contents:
- Score override controls
- Turn-order override controls
- Existing and future escape-hatch actions (skip, redo, manual score override)
- Any new host override control must be added through this override surface rather than as always-visible inline phase chrome.

Interaction and Accessibility:
- Trigger and panel controls must meet minimum touch target sizing (44px or larger).
- Panel supports keyboard navigation and escape-to-close behavior.
- Opening the panel must not pause or mutate server state by itself; only explicit override actions mutate state.

Architecture/Safety:
- Override actions continue to use server-authoritative mutations and shared contracts.
- Display remains read-only and never receives host-only override control state.
- PASS_AND_PLAY control-lock behavior remains intact; override controls must not bypass host unlock constraints.

Testing Expectations:
- Component tests cover trigger visibility/state indicator and panel open/close behavior.
- Component/integration tests cover phase availability and PASS_AND_PLAY lock behavior.
- Playwright coverage includes at least one end-to-end path proving override actions remain reachable and host/display sync stays correct.

---

## 6) Scoring

### Wing Points
- Per-player per round
- No penalties
- Not normalized by team size

### Mini-Game Points
- Defined in config
- No negative scoring

---

## 7) Technical Requirements (MVP)

- pnpm workspace monorepo
- Shared types in `packages/shared`
- Server authoritative for:
  - RoomState
  - Phase
  - Timers
  - Scoring
- RoomState snapshots include turn context:
  - `turnOrderTeamIds`
  - `roundTurnCursor`
  - `activeRoundTeamId`
  - `completedRoundTurnTeamIds`
- RoomState includes projected mini-game host/display view models.
- WebSockets (Socket.IO) for realtime sync
- Full state snapshot on reconnect
- In-memory state only
- LAN-first operation (no internet required)

---

## 8) Testing Requirements

Unit Tests (Vitest):
- Scoring logic
- State transitions
- Content validation

E2E Tests (Playwright):
- Host ↔ Display sync
- Phase transitions
- Refresh rehydrate

---

## 9) Acceptance Criteria

MVP complete when:

- Full multi-round session runs without restart
- Display rehydrates after refresh
- Host retains control after refresh
- Wing participation tracked per player
- Mini-game schedule follows config
- Display never scrolls
- Game resets cleanly to SETUP
- All tests pass
