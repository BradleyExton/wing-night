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
- Turn-based mini-games only: ONE team per turn. Only the input may go parallel — during that
  team's turn each of its players can answer on their own phone at the same time (a GEO pin, a
  TRIVIA choice); the host still locks and reveals ("Answers on the phones" below)
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
- A phone never advances a phase or moves a turn. Beyond the face it holds it changes three
  things: a contestant's own arcade leg (AGENTS.md §3.5); on the playing team, its own answer to
  the question in hand ("Answers on the phones" below — the host's lock scores it, never the
  phone); and, off the playing team, a side bet that never touches a score ("Spectator bets"
  below). Only the contestant's phone ever shows a game surface. A playing-team phone in a GEO
  or TRIVIA turn shows an answer card — its own chart to pin, or the question's choices — never
  the game surface itself; every other phone is a ballot, a bet or blank.

Host seat:
- The host seat is locked. A socket asking for HOST gets it only from the laptop itself (a
  loopback connection from a page on `localhost`) or with the host control token, which reaches
  the tablet through the QR on the laptop's root page; anything else is refused
  (`host_auth_required`), never quietly seated as a display. The token survives a server restart
  mid-party (README.md "Host Authorization").

Out of Scope (MVP) — for the party app. The pre-party guest portal ("Before the party" in §2) is
a separate deployable on wingnight.tv, and where it has one of these the line says so:
- Multiple rooms
- Accounts/auth system on the LAN — a phone is seated by the TV's join token and a per-face claim
  secret, not an account. Guest accounts (sign-in links and sessions) exist only on the pre-party
  portal, and nothing on the night reads them
- Persistent database in the party app — it stays in-memory over the pack's JSON files. Only the
  pre-party portal keeps a database (guests, sessions, votes in Cloudflare D1; heads in R2)
- Cloud deployment of the party app — it runs on the laptop. Only wingnight.tv (the teaser and the
  pre-party portal) is deployed
- Image uploads in the party app. Only the pre-party portal's avatar studio takes a guest's photo;
  the night reads heads `pnpm pack:pull` copied into the pack
- AI features in the party app, with one standing exception: RECREATE's live forgery (§3.3, "Local
  static assets"), which never decides a score and fails readable with no signal. Heads are painted
  before the night — by `pnpm import:avatars` or the portal's avatar studio — never at the party
- Multiple config selection

---

## 2) Party Setup

- 12–20 players
- 3–5 teams
- Players are preloaded from JSON (`players.json`, which `pnpm pack:pull` fills from the guest
  portal — "Before the party" below)
- Teams start from the pack's preset seating (§3.1–3.2) and are finished live in SETUP. How this
  night's teams are made is undecided, pending the guest vote: no team pages, phone self-pick or
  random draw on the TV exist
- Team sizes are locked once the game starts

Display runs on a laptop connected to a TV via HDMI and must remain full-screen, scroll-free, and distance-readable on a 4K TV.

### Before the party: the guest portal (wingnight.tv)

Pre-party is online; the party is not. The portal is a Cloudflare Worker (`apps/teaser-worker`)
behind the public teaser on wingnight.tv, with its own pages on the teaser's front end. It is a
separate deployable from the party app and shares nothing with it at runtime.

- **Guests are pre-created.** Brad adds every guest on `/admin`; nobody signs up. Each guest has a
  personal sign-in link (reusable until Brad mints a new one), sent by invite email or by hand.
  `/signin` (and a dead link's own page) offers "email me a new link": single-use, 30 minutes, and
  the same answer whether or not the address is on the list. A link's page (`/s/<token>`) signs in
  only on its button's POST, never on the GET a mail scanner prefetches.
- **Avatar studio** (`/me`). The guest takes or picks a photo (the browser downscales it and
  re-encodes it as JPEG), and Gemini paints a cartoon head from it, previewed on their bird. Five
  tries; a try Gemini plainly fails is given back. The guest keeps one head or tries again. The
  photo is deleted when a head is kept, when the last try is spent, or when the guest removes it,
  and painted tries are never stored. Heads are private to the guest and Brad, who can pick one
  kept head as the style reference for later paints and reset a guest's tries.
- **Private vote** (`/me`). Rank the team genres, name up to two teammates you'd sit with (seen
  only by Brad; nobody is told who asked for whom), and pick how teams should be made (Brad
  assigns, guests pick, a random draw on the TV). Changeable until the night.
- **Admin** (`/admin`, Brad's admin session only). The guest list with sign-in, head, vote and
  tries status; add, edit, invite, invite all, mint a link, reset tries; the head gallery; the
  vote summary (genre tallies, mutual wishes, who has still to vote).
- **Into the night pack, one way.** `pnpm pack:pull` copies every guest's name and kept head from
  the portal into `~/wing-night-content` (`local/players.json`, `local/assets/avatars/`), adding
  new guests unseated and never renaming or removing a player. Votes, wishes and email addresses never leave
  the portal; Brad reads the vote on `/admin` and seats teams himself.

The party itself stays local and offline: nothing on the night depends on the internet or on the
portal. GEO's map tiles degrade to a visible graticule with a note, and RECREATE's live forgery
fails readable and the host scores the prompt anyway.

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
- `TRIVIA` → `minigames/trivia.json` — `{ id, question, answer, choices? }`. `choices` is optional:
  2–6 distinct non-empty strings, one of which is exactly `answer` (the loader refuses a pack
  that breaks any of that). A question with choices is answered on the playing team's phones; one
  without is judged aloud by the host. A pack may mix both.
- `GEO` → `minigames/geo.json` — photos and their answer coordinates
- `RECREATE` → `minigames/recreate.json` — targets authored ahead of the night: a party photo
  (`sourceImageSrc`), the prompt that remixed it, the remix (`targetImageSrc`, painted by
  `pnpm import:recreate`) and the two-to-six visible `ingredients` that prompt put in it. The
  ingredients and the authored prompt are secrets: absent from the display view while a team is
  writing, unsealed once its prompt is in, the authored prompt only once the score is locked.

Current built-in unsupported runtime placeholders:
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
- Idle screen (the lobby), with the phones' join QR in its corner ("Player phones", §1)

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

### Answers on the phones (GEO, TRIVIA)

ONE team per turn, as ever. Only the input goes parallel: during that team's turn, each of its
players whose phone holds a face answers the question in hand on that phone, at the same time,
and the host still locks and reveals on the tablet. A night without phones plays exactly as
before — the tablet's own path is untouched.

- **Who answers**: the playing team's seated phones (claimed faces), and nobody else. A phone on
  another team, a socket with no face, any phase but `MINIGAME_PLAY` and any game but the one in
  play are refused. Answers are rate-limited like a contestant's input.
- **GEO**: every seated phone drops its own pin on its own chart (the GEO chart at phone scale;
  with no route to the map tiles it still takes the tap on its dark ground and graticule, and
  says so). The tablet's pin still counts as one more pin. The host's "Lock it in" locks the
  photo — it can lock on phone pins alone — and the team scores its BEST pin: the most points,
  then the shorter distance, then the tablet's pin before the phones' in roster order. After the
  lock a phone's pin is refused. The TV plots every pin at the reveal, each named, the best one
  starred.
- **TRIVIA**: a question with choices is answered on the phones (ONE choice on screen, a tap
  each, changeable until the lock). The host's "Lock answers" scores it:
  `points = round(1 × correct / seated)` — one question's worth (the point a CORRECT banks),
  scaled by the share of the team's phones that chose the answer, rounded half up. `seated` is
  the team's claimed phones that are awake at the lock, plus any asleep one that chose before it
  slept: an awake phone that never answered counts against the share, a sleeping one that never
  answered does not. **With one point a question this is a majority vote**: half the counted
  phones right bank the point, fewer bank nothing — there is no partial credit. Partial credit
  needs a per-question value above one (BACKLOG.md); that is Brad's call after a table test.
  "Lock answers" waits for at least one phone's answer (like GEO's lock, which waits for a pin).
  The turn's cap still clips the total. CORRECT / INCORRECT stay on every question as the spoken
  verdict and the escape hatch — a question without choices, a team with no phones, nobody's
  phone answering, or a host who would rather judge it aloud. "Next question" moves on from a
  reveal.
  The TV shows the spread (a bar per choice, the answer marked ✓ "The answer") and the result.
- **Secret until the lock**: before the host locks a question the TV and the room hear only how
  many are in ("2 of 3 in"), the tablet the same count (never who or what — it is in the team's
  hands), and each phone only its own answer, over its own room. The spread, every pin and every name are
  the reveal. An answer belongs to the guest who gave it: a face let go while the question is
  open loses its answer, and the next guest to sit in it never sees one.
- **Undo**: an answer is play, not a ruling — it never becomes the host's undo point. The host's
  lock is, and undoing it reopens the question with every answer still in — except those of
  guests who have let their faces go since, which leave with them.
- **A phone cannot take the party down**: every phone message is shape-checked (an unknown game
  is malformed), and a fault handling one is logged and refused, never thrown.

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
- A phone's answer never scores by itself: the host's lock turns the answers in into points
  ("Answers on the phones")

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
  - `server:stateSnapshot` emits a role-scoped envelope (`toRoleScopedSnapshotEnvelope`): the
    full `RoomState` to the host (bet picks aside until they settle), a display-safe one to the
    TV, and the player allow-list to a phone (AGENTS.md §3.4).
- Generic mini-game mutation envelope:
  - Host sends `minigame:action` payloads with `hostSecret`, `minigameId`, `minigameApiVersion`, `actionType`, and `actionPayload`.
  - Server validates host authorization, active mini-game match, and contract compatibility before dispatch.
  - A phone sends `player:minigameAction`: the same envelope without the secret, authorized by the
    face its socket holds (a contestant's own arcade leg, or a playing-team answer — AGENTS.md
    §3.4–3.5).
- In-memory state only
- LAN-first operation (no internet required on the night; the guest portal is pre-party only)

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
