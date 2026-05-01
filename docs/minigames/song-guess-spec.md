# Song Guess Minigame Spec (MVP)

Status: Draft for implementation

Last updated: 2026-05-01

## 1) Goals

- Ship a full `SONG_GUESS` minigame that fits the existing Wing Night turn loop.
- Play Richard Cheese lounge covers of well-known songs; teams identify the original title and artist.
- Keep server authoritative for minigame phase state and scoring.
- Keep the display answer-safe until the host triggers the reveal.
- Host drives all pacing manually — no timers.

## 2) Locked Product Decisions

- Teams answer verbally; no team-facing submission UI is required.
- Audio files are local (host-uploaded MP3s), served by the Express server.
- Scoring: +1 point for correct song title, +1 point for correct original artist. Max 2 points per song.
- 4 songs per round (configurable via `songsPerRound` in the content file).
- Host may replay the clip once per song; the app enforces the one-replay limit.
- Scoring leniency is host judgment only — the app shows the correct answer for reference and the host marks correct/incorrect.
- All teams are scored independently (no first-to-buzz advantage).
- Running scores are visible on the host screen during the round; the display screen hides scores until round end.
- Host manually triggers each phase transition (play, pause, replay, reveal, next song, end round).
- On reveal: the display shows the song title and artist, and both host and display clients play the cover from `revealStart`.
- The display shows: song number + "🎵 Listen closely…" (pre-clip and during clip), "Lock in your answers" (guessing), and title + artist (reveal).
- `SONG_GUESS` is added as a new `MinigameType` enum member; existing minigame types are untouched.

## 3) Non-Goals (MVP)

- No admin UI for song setup — songs are authored as a JSON config file.
- No text-matching or fuzzy answer validation in the app.
- No team device submission flow.
- No per-song difficulty-based scoring.
- No streaming audio source (Spotify, YouTube).
- No sample song content ships with the repo (audio files are gitignored event-specific assets).

## 4) Game Flow In MINIGAME_PLAY

For each song in the round:

1. Host presses **Play Clip** → clip audio plays on host and display clients from `clipStart` to `clipEnd`.
2. Host presses **Pause** → display switches to "Lock in your answers"; teams state their guess verbally.
3. Host may press **Replay** once → clip plays again from `clipStart`; replay button disabled after use.
4. Host presses **Reveal** → display shows title + artist; cover plays from `revealStart` on both clients.
5. Host marks each team: **Title ✓/✗** and **Artist ✓/✗** — host judgment applies for close answers.
6. Host presses **Next Song** to advance (or **End Round** after the final song).

After all songs are scored, host presses **End Round** → display shows final round scores; points normalize into the round point budget.

## 5) Config And Content Contracts

### 5.1 `gameConfig.json`

No `SONG_GUESS`-specific fields are added to `gameConfig.json`. `songsPerRound` lives in the minigame content file.

### 5.2 Song guess content file

Add shared content schema:

- `packages/shared/src/content/songGuess/index.ts`

Add content file location (local only, no sample):

- `content/local/minigames/song-guess.json`

Schema:

```ts
type SongGuessEntry = {
  id: string;
  file: string;           // filename only, e.g. "smells-like-teen-spirit.mp3"
  clipStart: number;      // seconds
  clipEnd: number;        // seconds
  revealStart: number;    // seconds
  correctTitle: string;
  correctArtist: string;
  difficulty?: "easy" | "medium" | "hard";  // host reference only
  hint?: string;          // optional hint the host can read aloud
};

type SongGuessContentFile = {
  songsPerRound: number;
  songs: SongGuessEntry[];
};
```

Validation rules:

- `songsPerRound` required, must be a positive integer, must not exceed `songs.length`.
- `songs` required, at least 1 entry.
- Each song must have non-empty `id`, `file`, `correctTitle`, `correctArtist`.
- `clipStart < clipEnd`, both non-negative.
- `revealStart` non-negative.
- Song `id`s must be unique.

Example:

```json
{
  "songsPerRound": 4,
  "songs": [
    {
      "id": "smells-like-teen-spirit",
      "file": "smells-like-teen-spirit.mp3",
      "clipStart": 12.5,
      "clipEnd": 27.0,
      "revealStart": 45.0,
      "correctTitle": "Smells Like Teen Spirit",
      "correctArtist": "Nirvana",
      "difficulty": "easy",
      "hint": "90s grunge anthem"
    }
  ]
}
```

### 5.3 Audio file location

Audio files live at:

```
content/local/minigames/song-guess/audio/<filename>
```

This directory is gitignored (part of the existing `content/local/` gitignore).

### 5.4 Audio file serving

The Express server adds a static file route:

```
GET /minigame-assets/song-guess/:filename
→ content/local/minigames/song-guess/audio/:filename
```

Clients reference audio by URL: `/minigame-assets/song-guess/smells-like-teen-spirit.mp3`.

Return `404` if the file does not exist. No authentication required (LAN-only game).

### 5.5 Loader integration

File: `apps/server/src/contentLoader/loadMinigameContent/index.ts`

- Song guess runtime plugin declares `content.fileName = "minigames/song-guess.json"`.
- Existing plugin content loading path remains unchanged.
- If the content file is missing and `SONG_GUESS` is used in a round, surface a `fatalError` to the host client.

## 6) Runtime Contract

File: `packages/minigames/song-guess/src/runtime/index.ts`

### 6.1 State model

```ts
type TeamSongScore = {
  title: boolean | null;   // null = not yet marked
  artist: boolean | null;
};

type SongGuessPhase =
  | "idle"          // before first song starts
  | "clip_playing"  // clip audio is playing
  | "clip_paused"   // clip paused, teams guessing
  | "reveal"        // title + artist shown, reveal audio playing
  | "done";         // all songs scored, awaiting End Round

type SongGuessRuntimeState = {
  phase: SongGuessPhase;
  songCursor: number;                               // 0-indexed, into selectedSongIds
  selectedSongIds: string[];                        // subset of songsPerRound songs, order locked on init
  replayUsed: boolean;                              // resets per song
  scoresBySongByTeamId: Record<string, Record<string, TeamSongScore>>; // songId → teamId → score
  pendingPointsByTeamId: Record<string, number>;
};
```

### 6.2 Action types

Use the existing `minigame:action` envelope with `SONG_GUESS`-specific `actionType` values:

- `playClip` — host starts playing the clip for the current song
- `pauseClip` — host pauses (moves to guessing phase)
- `replayClip` — host replays the clip (once per song)
- `triggerReveal` — host reveals title + artist, reveal audio begins
- `markTeamTitle` — host marks a team's title correct or incorrect
- `markTeamArtist` — host marks a team's artist correct or incorrect
- `nextSong` — host advances to the next song
- `endRound` — host ends the round

Payload shapes:

```ts
type MarkTeamTitlePayload = {
  teamId: string;
  correct: boolean;
};

type MarkTeamArtistPayload = {
  teamId: string;
  correct: boolean;
};
```

`playClip`, `pauseClip`, `replayClip`, `triggerReveal`, `nextSong`, `endRound` use empty object payload `{}`.

### 6.3 Reducer rules

- Ignore actions that are invalid for the current phase (e.g. `replayClip` when `replayUsed === true`).
- `playClip`: valid in `idle` or `clip_paused`. Sets phase to `clip_playing`.
- `pauseClip`: valid in `clip_playing`. Sets phase to `clip_paused`.
- `replayClip`: valid in `clip_paused` when `replayUsed === false`. Sets `replayUsed = true`, phase to `clip_playing`.
- `triggerReveal`: valid in `clip_paused`. Sets phase to `reveal`.
- `markTeamTitle` / `markTeamArtist`: valid in `reveal`. Records result for the team. Increments `pendingPointsByTeamId[teamId]` by 1 if correct, clamp to `pointsMax`.
- `nextSong`:
  - Valid in `reveal` (all teams need not be marked — host judgment).
  - Advances `songCursor`.
  - If `songCursor` reaches `selectedSongIds.length`, sets phase to `done`.
  - Otherwise resets `replayUsed = false`, sets phase to `idle`.
- `endRound`: valid in `done`. No state change — the runtime layer handles point finalization.

### 6.4 Song selection

- On `initialize`, randomly select `songsPerRound` songs from `content.songs` without replacement.
- Store their IDs in `selectedSongIds` in the selected order.
- `songCursor` starts at 0.

## 7) Host And Display Projection

Server projections are the only source for `minigameHostView` and `minigameDisplayView`. The display payload must never include the correct title or artist before `phase === "reveal"`.

### 7.1 Contract update strategy

Add `SongGuessHostView` and `SongGuessDisplayView` as new discriminated union members in:

`packages/shared/src/roomState/index.ts`

Existing view types are not changed.

### 7.2 Song guess host view

```ts
type SongGuessHostView = {
  minigame: "SONG_GUESS";
  phase: SongGuessPhase;
  songCursor: number;
  songsTotal: number;
  replayUsed: boolean;
  currentSong: {
    id: string;
    audioUrl: string;
    clipStart: number;
    clipEnd: number;
    revealStart: number;
    correctTitle: string;
    correctArtist: string;
    difficulty?: string;
    hint?: string;
  } | null;
  scoresBySongByTeamId: Record<string, Record<string, TeamSongScore>>;
  pendingPointsByTeamId: Record<string, number>;
};
```

`audioUrl` is the resolved `/minigame-assets/song-guess/:filename` URL, constructed server-side.

### 7.3 Song guess display view

```ts
type SongGuessDisplayView = {
  minigame: "SONG_GUESS";
  phase: SongGuessPhase;
  songCursor: number;
  songsTotal: number;
  reveal: {
    title: string;
    artist: string;
    audioUrl: string;
    revealStart: number;
  } | null;
};
```

`reveal` is non-null only when `phase === "reveal"`. Display never receives `correctTitle`, `correctArtist`, or audio timing outside of reveal.

Display behavior by phase:

| Phase | Display shows |
|---|---|
| `idle` | Song number (e.g. "Song 2 of 4") + "🎵 Listen closely…" |
| `clip_playing` | Same + animated music note indicator |
| `clip_paused` | "Lock in your answers" |
| `reveal` | Song title + original artist (large); reveal audio plays from `revealStart` |
| `done` | Final scores for the round |

## 8) Client Rendering Spec

### 8.1 Audio playback

Use the native `<audio>` element. No audio library required.

Both host and display clients load the audio file via `audioUrl` from their respective view projections.

Host client controls:
- On `playClip` action dispatch: seek to `clipStart`, call `.play()`.
- On `pauseClip` action dispatch: call `.pause()`.
- On `replayClip` action dispatch: seek to `clipStart`, call `.play()`.
- On `triggerReveal` action dispatch: seek to `revealStart`, call `.play()`.

Display client controls:
- When `phase` transitions to `clip_playing`: seek to `clipStart`, call `.play()`.
- When `phase` transitions to `clip_paused` or `reveal` with a new song: pause or seek as appropriate.
- When `reveal` becomes non-null: seek to `revealStart`, call `.play()`.

Both clients handle autoplay restrictions gracefully (e.g. require a prior user interaction before audio plays — the host's first button press satisfies this).

### 8.2 Host surface components

Files under:

- `packages/minigames/song-guess/src/client/HostSongGuessSurface/`

Required controls on host play surface:

**Song info panel:**
- Song number (e.g. "Song 1 of 4")
- Correct title + artist (always visible to host)
- Difficulty badge (if present)
- Hint text (if present)

**Playback controls:**
- Play Clip button (disabled when `phase === "reveal"` or `phase === "done"`)
- Pause button (visible when `phase === "clip_playing"`)
- Replay button (disabled after `replayUsed === true`)
- Reveal button (enabled when `phase === "clip_paused"`)

**Scoring panel (visible during `reveal`):**
Per team row:
- Team name
- Title: ✓ / ✗ toggle
- Artist: ✓ / ✗ toggle
- Running total for that team

**Navigation:**
- Next Song button (enabled when `phase === "reveal"`)
- End Round button (enabled when `phase === "done"`)

**Running totals panel:**
- All teams + their accumulated points so far this round (visible throughout)

Intro surface:
- Show rules summary (Richard Cheese covers, guess title + artist, 1 point each).

### 8.3 Display surface components

Files under:

- `packages/minigames/song-guess/src/client/DisplaySongGuessSurface/`

Renders based on `SongGuessDisplayView`. Phases map to distinct visual states as described in section 7.3.

## 9) Dev Sandbox Requirements

File: `packages/minigames/song-guess/src/dev/index.ts`

Add scenarios:

- Intro idle
- Clip playing (song 1 of 4)
- Clip paused / guessing
- Reveal (title + artist shown, scoring in progress)
- Done (all 4 songs complete, awaiting End Round)

Use a mock audio URL pointing to a test file or silence so sandbox scenarios don't require real Richard Cheese assets.

## 10) Server And Socket Integration

Existing envelopes already support generic action dispatch. No new socket event names are required.

Key paths:

- `apps/server/src/socketServer/index.ts`
- `apps/server/src/roomState/index.ts`
- `apps/server/src/minigames/runtime/index.ts`

Add static file route for audio serving:

- `apps/server/src/index.ts` — register `/minigame-assets/song-guess` static route pointing to `content/local/minigames/song-guess/audio/`.

## 11) Dependency Plan

No new dependencies required. Native `<audio>` element handles all playback.

## 12) Testing Plan

### 12.1 Unit tests

Add tests for:

- Song guess content validation (missing fields, `songsPerRound > songs.length`, duplicate IDs, invalid timestamps).
- Runtime reducer action behavior per phase (valid transitions, ignored invalid actions).
- Replay enforcement (`replayClip` ignored when `replayUsed === true`).
- Point accumulation and clamping to `pointsMax`.
- Song selection — `selectedSongIds.length === songsPerRound`.
- Display-safe projection (no `correctTitle`/`correctArtist` before reveal phase).

### 12.2 Component tests

- Host surface renders correct controls per phase.
- Replay button disables after use.
- Scoring toggles per team update correctly.
- Display surface renders correct UI per phase.

### 12.3 E2E tests (Playwright)

Cover:

- Host plays clip → display shows listening state.
- Host pauses → display shows lock-in prompt.
- Host replays → replay button disables.
- Host reveals → display shows title + artist.
- Host marks all teams → running totals update on host screen.
- Host ends round → display shows final scores.
- Refresh/reconnect rehydrates current phase and scores.

## 13) Acceptance Criteria

- `SONG_GUESS` runtime no longer returns unsupported stub state.
- Host can play, pause, replay (once), and reveal each song.
- Display never shows correct title or artist before reveal.
- Each correct title/artist awards exactly +1 pending point, clamped to `pointsMax`.
- Running totals are visible on host screen throughout the round.
- Display scores are hidden until End Round.
- Audio plays from correct timestamps on both host and display clients.
- Existing test suites pass, plus new song-guess coverage.

## 14) Incremental Delivery Steps

1. Shared contracts — `MinigameType` enum update, content schema, `SongGuessHostView` / `SongGuessDisplayView` room state types.
2. Audio file serving — Express static route for `content/local/minigames/song-guess/audio/`.
3. Runtime reducer with tests — phase transitions, scoring, song selection.
4. Host surface — playback controls, scoring panel, running totals.
5. Display surface — phase-driven UI states.
6. Dev sandbox scenarios.
7. E2E coverage.

## 15) Prework Flagged

- **Admin UI for minigame configs** — a web UI that reads and writes config JSON files across all minigames (including song-guess.json and song file uploads). Not in scope for this build; to be designed as a standalone project before implementation.
