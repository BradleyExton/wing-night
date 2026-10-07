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
- Two screens, and the guests' phones:
  - Host UI (tablet-optimized)
  - Display UI (TV-optimized, HDMI laptop)
  - Player UI (`/play`, a guest's phone held upright) — see "Player phones" below
- Display must:
  - Be read-only
  - Never scroll vertically
  - Fill the viewport (`100dvh` / no overflow)
  - Be optimized for a 4K living-room TV first, while remaining usable at 1080p/720p
  - Keep critical phase/round context legible from across a room
- All devices run on the same local Wi-Fi network (LAN-first)
- Server holds authoritative state (in-memory only)
- Host-driven phase progression (never auto-advance)
- Turn-based mini-games only (one team at a time)
- Escape hatches always available (skip, redo, manual scoring)

Player phones:
- A guest's phone joins on the party Wi-Fi over plain HTTP — no tunnel, no internet. During
  SETUP the TV shows a QR for `/play?t=<joinToken>` at the laptop's LAN address; the phone scans
  it, sees tonight's roster as birds, and taps its own face to claim it. A face another phone
  holds is greyed out. One face per phone: a second face claimed from the same Wi-Fi address
  gives the first back to the room (the laptop itself is exempt, for testing).
- The phone is then that player: it shows the guest's bird, their team (or "not on a team
  yet") and "watch the TV", with a "this isn't me" release that asks for one confirming tap.
  Teams are never chosen on a phone — the tablet seats players. Phones play no sound; the TV
  is the room's only speaker.
- A phone sleeps (plain HTTP cannot hold a wake lock), so coming back is instant: it keeps a
  claim secret and reconnects as the same player with no re-pick.
- On the tablet's SETUP screen, the Players list badges each claimed player (phone in /
  asleep) with a one-tap Free button that gives the face back; the server accepts a free in
  any phase, but SETUP is the only screen that shows the control. Under the list, "New join
  code" swaps the TV's QR: new phones need the new code, phones already holding a face keep
  it. Reset Game frees every face and rotates the code, so every phone scans the TV again.
- Claims and releases are rate-limited per phone, and the TV hears claim changes at most ten
  times a second.
- A phone never advances a phase or moves a turn. Beyond the face it holds it changes two
  things: a contestant's own arcade leg (AGENTS.md §3.5) and, off the playing team, a side bet
  that never touches a score ("Spectator bets" below). Only the contestant's phone ever shows a
  game; every other phone is a ballot, a bet or blank.

Out of Scope (MVP):
- Multiple rooms
- Accounts/auth system on the LAN — a phone is seated by the TV's join token and a per-face claim
  secret, not an account
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

Display runs on a laptop connected to a TV via HDMI and must remain full-screen, scroll-free, and distance-readable on a 4K TV.

---

## 3) Content Packs (Engine vs Content Separation)

Wing Night separates engine from custom content.

### Loading Priority

1. `<content root>/local/` (the night pack, or the repo's gitignored `content/local/`)
2. Fallback to `content/sample/` (committed)

If local content is missing, sample content must allow the game to run.

---

### 3.1 Players Preset

Loaded from:

- `<content root>/local/players.json`
- fallback: `content/sample/players.json`

Format:

{
  "players": [
    { "name": "Brad", "avatarSrc": "avatars/brad.png", "team": "Molten Metal" },
    { "name": "Mike" }
  ]
}

Rules:
- `name` required
- `avatarSrc` optional
- Missing avatar → initials fallback
- `team` optional — the team this player starts the night on, by team NAME from
  `teams.json` (matched ignoring case and surrounding whitespace)
- A `team` naming no declared team is invalid content: the load fails with a clear
  error rather than leaving the player unassigned
- Missing `team` → player starts unassigned, exactly as before

---

### 3.2 Teams Preset

Loaded from:

- `<content root>/local/teams.json`
- fallback: `content/sample/teams.json`

Format:

{
  "teams": [
    { "name": "Team A" },
    { "name": "Team B" }
  ]
}

Rules:
- `name` required
- Team rosters are seated from `players.json` — a team holds the players whose `team`
  names it, in `players.json` order, and is empty when none do
- Preset seating is a starting point, not a lock: the host still adds, moves and
  auto-assigns players in SETUP until the game locks
- Missing local `teams.json` falls back to sample preset teams
- Host can still add teams manually in SETUP
- Reset Game restores the preset seating, discarding the live moves made on top of
  it; teams and guests the host added live survive the reset with empty rosters
- Teams lock when game starts

---

### 3.3 Game Configuration (Data-Driven Rounds)

Loaded from:

- `<content root>/local/gameConfig.json`
- fallback: `content/sample/gameConfig.json`

Example:

{
  "name": "House Party Pack",
  "setupPreviewRoundSlots": 8,
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
  "minigameRules": {
    "trivia": { "questionsPerTurn": 5 }
  },
  "timers": {
    "eatingSeconds": 120,
    "geoSeconds": 45,
    "drawingSeconds": 60,
    "emojiCharadesSeconds": 90
  }
}

Rules:
- Exactly one active config file
- Each round must define `minigame`
- Config locks once game starts
- Invalid config blocks start
- `setupPreviewRoundSlots` is optional and controls setup-screen lineup preview slots (filler cards render when slots exceed configured rounds)
- `timers` must carry `eatingSeconds` plus one field per clock-paced minigame; host-paced
  games (`TRIVIA`, `SONG_GUESS`, `JOUST`) declare `timerKey: null` and contribute none
- `minigameRules` is optional, keyed by each game's `rulesKey`; an omitted game falls back to
  its runtime plugin's defaults

---

### 3.3 Mini-Game Content

Minigame content files are plugin-declared and loaded from:
- `<content root>/local/<plugin-file>.json`
- fallback: `content/sample/<plugin-file>.json`

Current built-in content-backed minigames include:
- `TRIVIA` → `minigames/trivia.json`
- `RECREATE` → `minigames/recreate.json` — targets authored ahead of the night: a party photo
  (`sourceImageSrc`), the prompt that remixed it, the remix (`targetImageSrc`, painted by
  `pnpm import:recreate`) and the two-to-six visible `ingredients` that prompt put in it. The
  ingredients and the authored prompt are secrets: absent from the display view while a team is
  writing, unsealed once its prompt is in, the authored prompt only once the score is locked.

Current built-in unsupported runtime placeholders:
- `GEO` (no content file required yet)
- `DRAWING` (no content file required yet)

Local static assets:
- `<content root>/local/assets/` — images, served by the server at `/content-assets/<path>` and
  named pack-relative in content (`avatars/brad.png`, `geo/cottage.jpg`)
- `<content root>/local/assets/recreate/attempts/` — written by the SERVER during play: the one
  place the app generates content at party time. RECREATE sends each team's prompt (with the
  target's source photo attached) to the Gemini image API once per attempt; the reply is saved
  here and served like any other asset. No key, no signal or a refusal fails the attempt with a
  readable reason and the host scores the prompt anyway — the call can never stall a turn, and
  the picture never decides the score.

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
3. MINIGAME_INTRO
4. EATING
5. MINIGAME_PLAY
6. TURN_RESULTS
7. ROUND_RESULTS
8. FINAL_RESULTS

Rounds 1–N repeat phases 3–7 with a per-team loop:
- `MINIGAME_INTRO -> EATING -> MINIGAME_PLAY -> TURN_RESULTS` (once per team, in the round's turn order)
- `ROUND_RESULTS` (once after the last team turn in the round)

A round has no announcement beat of its own: it opens on its first team's
`MINIGAME_INTRO`, which is where the round counter turns over and the turn
order is read. The sauce reveals on the TV at `EATING`, where the room is
about to eat it, and rides the host rail through the briefing.

---

## 5) Phase Definitions

### SETUP
Host:
- Load players (already seated on the teams their preset declares)
- Load teams
- Create/add teams
- Add players
- Assign players
- Auto-assign remaining players (host action)
- Lock game (disabled until valid)

Display:
- Idle screen

---

### INTRO
Host:
- Setup surfaces stay visible in read-only/locked mode.
- Primary action changes to `Start Game`.

Display:
- Setup flow surface remains visible in locked mode (`Game Locked In`).
- On host start action, display runs a local 3-second countdown (`3 → 2 → 1`) before handing over to the first team's briefing.
- Turn order is editable here, before round one starts. The order set here is the base order: round one plays it as listed, and every later round opens one team further down it (see MINIGAME_PLAY).

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
Host:
- Route switches to a full-screen mini-game takeover shell (`100dvh`, no vertical overflow).
- Host shell renders plugin intro context from `minigameHostView`.
- Shell-level escape hatches remain reachable via override overlay controls.

Display:
- Route switches to a full-screen mini-game takeover shell (`100dvh`, no vertical overflow).
- Display plugin intro renders from `minigameDisplayView` only.
- Active team context comes from snapshot active-team fields (`activeRoundTeamId`, `activeTurnTeamId`).
- Unsupported mini-games render an explicit unsupported fallback surface.

---

### MINIGAME_PLAY (Turn-Based)

- One active team turn at a time
- Round N (1-based) opens with the team at index `(N-1) mod teams.length` of the host-edited base order, and the rest follow in that order, wrapping, so no team is always first to play a fresh mini-game. `turnOrderTeamIds` on the snapshot stays the base order; surfaces resolve the round's order from it (`resolveRoomTurnOrderTeamIds`), and a reorder at `ROUND_RESULTS` is taken as the upcoming round's order and stored as the base that produces it.
- Mini-game scoring mutations are accepted for the active team only
- PASS_AND_PLAY hides host controls
- Host unlock via press-and-hold
- Host route stays in full-screen takeover shell and renders plugin gameplay from `minigameHostView`.
- Display route stays in full-screen takeover shell and renders plugin gameplay from `minigameDisplayView`.
- Server snapshot carries `minigameHostView` and `minigameDisplayView` for this phase.
- Host and display surfaces show active team context (team name only) based on snapshot active-team fields (`activeRoundTeamId`, `activeTurnTeamId`).
- Display surface remains answer-safe (no secret answer payloads).

---

### TURN_RESULTS
Display:
- Team-turn transition state while the next team gets ready
- Standings snapshot before the next team briefing or round totals

At this phase:
- No cumulative score application yet; pending round totals remain buffered until `ROUND_RESULTS`

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

### Quick Play (session mode)

The same engine with the wings taken out, for trying a mini-game with whoever is in the room
without running the night. Entered from `/quickplay` on the host tablet (linked from SETUP's hero
and the screen picker); the TV stays on `/display` and follows as it always does.

- `RoomState.sessionMode` is `NIGHT` or `QUICK_PLAY`. Server-owned; every phase transition
  reads it. `createInitialRoomState` and Reset Game return the room to `NIGHT`.
- One host-authorized event, `quickplay:start`, carries the whole session: an ordered queue of
  `{ minigame, rules?, timerSeconds? }` and the dealt teams `{ teamId, playerIds }`. Legal only
  from `SETUP`. The server rebuilds the game config from the loaded pack —
  `buildQuickPlayGameConfig` — with the queue as the rounds (one round per queued game, in
  queue order, sauce `"No sauce"`, `pointsPerPlayer` 1), the pack's scoring, and the pack's
  rules and clocks except where a queued game overrides its own. The result runs through the
  same validator as the pack, plugin rules included; a request that fails it is a no-op.
- Teams are the pack's PRESET teams (name, genre, anthems, colour) with the launcher's roster
  in place of the preset seating; players not dealt onto a team leave `roomState.players` for
  the session. The game config is set on live state only, never on the setup baseline, so
  Reset Game restores the pack's real night, roster and all.
- The room opens directly on `MINIGAME_INTRO` for the first dealt team (round 1, no lock screen,
  no count-in). In `QUICK_PLAY`, `MINIGAME_INTRO -> MINIGAME_PLAY`: there is no `EATING`, no
  eating timer and no wing points. Everything after — `TURN_RESULTS`, `ROUND_RESULTS`, the
  next queued game, `FINAL_RESULTS` — is the night's own machine. Skip, redo and score
  overrides stay exactly where they are.
- The host rail counts games (`Game 1 of 2`) and drops the sauce slot; the briefing's primary
  action reads `Start Mini-Game`.
- The launcher (`/quickplay`): tick who is here (`Everyone` / `Clear`), pick how many teams
  (2 … the pack's team count; the first N preset teams are dealt), `Shuffle` or tap a name to
  bump it to the next team, tap games to queue them in order, and edit each queued game's
  scalar rules and clock, seeded from the pack. Start is disabled until at least one game is
  queued and every team has a player. Once the server opens the session the tablet navigates
  itself to `/host`. A room already past `SETUP` gets the way back and a two-tap reset instead.

---

### Spectator bets (side game)

The watchers' job. Before each team's turn, every guest whose phone holds a face and who is NOT
on the team about to play calls OVER or UNDER on that turn's score. It is a side game: a bet
never touches `totalScore`, the pending round points or any team's standing.

- **The line** is one visible rule for every game: `floor(max / 2) + 0.5`, where `max` is the
  turn's minigame points cap (`defaultMax`, or `finalRoundMax` on the last round) — 7.5 on a cap
  of 15, 10.5 on 20. A whole-number score can never land on a .5 line, so every turn settles and
  somebody called it. A turn with no cap (or a cap of 0) has no bets.
- **The window** opens when the turn's briefing does (`MINIGAME_INTRO`) and closes when play
  starts (`MINIGAME_PLAY`), so a night's window is the briefing and the wings and a Quick Play
  window the briefing alone. One pick per player, changeable until it closes; the playing team
  cannot bet. No host action is needed.
- **Settlement** is on the turn's results: the turn's points are what the team adds to its
  pending minigame points during the turn (not the round's pending total). An undo on the
  results re-settles it. Leaving the results freezes it: each bettor's record (won / played)
  takes it once. A skipped turn's bets are void and count for nobody; a push (only reachable by
  a fractional score) is no bet. Reset Game clears every bet and every record.
- **Nobody herds**: until the turn settles no screen shows a pick — the TV and the phones see
  how many have bet, the host also sees who, and each phone is told its own pick alone. A pick
  belongs to the guest who placed it, not the face: a face let go or freed while the window is
  open loses its pick, and whoever sits in it next is never told one. Once settled, the picks
  are the show.
- **Screens**: the phone shows the line and two buttons (then "bet locked — watch the TV", then
  whether it called it); the TV shows the line and the count on the briefing and the wings,
  nothing about bets during play, the settlement (line, score, side, who called it) on the
  turn's results, and the best bettor in one line on the final results; the tablet shows a
  compact count while the window is open.
- **Best bettor**: the most bets won; level on wins, the fewer bets played; still level, the
  title is shared. Nobody who won nothing is named. No team bonus.

---

### Host Override Access (Tablet UX)

Goal:
- Keep escape hatches immediately reachable without permanently occupying primary phase layouts.

Entry Point:
- Host UI exposes a persistent `Overrides` trigger in the bottom-right corner.
- Trigger remains visible in all host gameplay phases (`INTRO`, `MINIGAME_INTRO`, `EATING`, `MINIGAME_PLAY`, `TURN_RESULTS`, `ROUND_RESULTS`, `FINAL_RESULTS`).
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
- Snapshot rehydrate behavior:
  - Clients request latest state with `client:requestState` on connect.
  - `server:stateSnapshot` currently emits `RoomState` (role-scoped envelope types are defined for compatibility work).
- Generic mini-game mutation envelope:
  - Host sends `minigame:action` payloads with `hostSecret`, `minigameId`, `minigameApiVersion`, `actionType`, and `actionPayload`.
  - Server validates host authorization, active mini-game match, and contract compatibility before dispatch.
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
- Game resets cleanly to SETUP, with the preset seating restored
- All tests pass
