# Emoji Charades Minigame Spec (MVP)

Status: Draft for implementation

Last updated: 2026-05-01

## 1) Goals

- Ship a full `EMOJI_CHARADES` minigame that fits the existing Wing Night turn loop.
- One picker per team per turn; team chooses who holds the tablet (same physical handoff model as Drawing — the runtime does not track picker identity).
- Active team picks a deck on the tablet at start of turn; subjects within a deck served in random order.
- Picker sees the subject on the tablet and taps emojis; the emoji sequence streams to the TV display in real time.
- Display never sees the subject text during play — only the emoji sequence the picker is building.
- Brief subject reveal on display after Got It / Skip, then onto the next subject. Same reveal pattern as Drawing.

## 2) Locked Product Decisions

- One picker per turn. Team self-organizes physically; the runtime is agnostic to which player holds the tablet (mirrors `drawing-spec.md` §4 step 2).
- Two turns per team total = schedule `EMOJI_CHARADES` **twice in `gameConfig.json`**, once per Wing Night round. The minigame itself runs one 90s turn per scheduled round.
- Phase timer is the only turn constraint (`emojiCharadesSeconds`, default 90). Hard cutoff at zero, no late taps.
- Scoring: `+1` per correct subject, configurable via `minigameRules.emojiCharades.pointsPerCorrect`.
- Deck selection happens inside `MINIGAME_PLAY`, before play begins, while the active team holds the tablet.
- A deck is only selectable if `deck.subjects.length >= pointsMax`. Server rejects under-sized decks; this gate guarantees mid-turn subject exhaustion is impossible.
- Skip costs no points and has no penalty. The 90s clock is the disincentive.
- Letter emojis (regional indicators 🇦–🇿 and keycap digits 0️⃣–9️⃣) are banned by default in the picker; configurable via `minigameRules.emojiCharades.banLetterEmojis`.
- Display reveals the resolved subject text briefly after Got It / Skip (`REVEAL_MS = 2000`); reveal is display-client-driven (`now < expiresAtMs`).
- Emoji catalog (categories + per-tab emoji sets) is hardcoded in the picker UI, not content-driven.
- `EmojiCharadesHostView | EmojiCharadesDisplayView` are added as new discriminated union members in `MinigameHostView` / `MinigameDisplayView`.

## 3) Non-Goals (MVP)

- No rotating picker / no in-app handoff between teammates within a turn.
- No interactive warmup or sandbox before the round.
- No fuzzy / app-side answer validation — picker taps Got It based on what teammates shouted.
- No content-driven emoji picker (the emoji catalog is in client code).
- No per-deck difficulty or weighting.
- No host advance from a separate host control surface — the picker drives all play actions from the tablet.
- No max-skip rule; unlimited skips, timer governs.

## 4) Game Flow In MINIGAME_PLAY

For the active team turn:

1. Active team holds the tablet; display shows the available decks alongside team context.
2. Active team taps a deck on the tablet → runtime shuffles that deck's subjects, advances to `playing` sub-state.
3. Tablet shows the current subject text + emoji picker; display shows an empty emoji canvas + active team name.
4. Picker taps emojis on the tablet; the sequence streams to the display in real time.
5. Picker taps **Got It** (`+1` point) or **Skip** (`+0`) when the team guesses or gives up.
6. Runtime briefly reveals the resolved subject text on the display (2s window).
7. Runtime clears the emoji sequence and advances `subjectCursor` to the next subject.
8. Loop until phase timer fires; phase advances via the existing room flow.
9. If the picker hits Got It on the last subject in the shuffled list (theoretically possible if `pointsMax > deck.subjects.length`, but the deck-selection gate prevents this), the runtime blocks further `markCorrect` / `skipSubject` actions until the timer ends.

## 5) Config And Content Contracts

### 5.1 `gameConfig.json`

Add `EMOJI_CHARADES` to `MINIGAME_DEFINITIONS`:

```ts
EMOJI_CHARADES: {
  id: "EMOJI_CHARADES",
  slug: "emoji-charades",
  timerKey: "emojiCharadesSeconds",
  rulesKey: "emojiCharades",
  contractMetadata: {
    minigameApiVersion: MINIGAME_API_VERSION,
    capabilityFlags: []
  }
}
```

Extend `GameConfigTimers`:

```ts
type GameConfigTimers = {
  // ...
  emojiCharadesSeconds: number; // default 90 in sample config
};
```

Extend `MinigameRules`:

```ts
type EmojiCharadesMinigameRules = {
  pointsPerCorrect: number;       // default 1
  banLetterEmojis: boolean;       // default true
};

type MinigameRules = {
  trivia?: TriviaMinigameRules;
  geo?: GeoMinigameRules;
  songGuess?: SongGuessMinigameRules;
  emojiCharades?: EmojiCharadesMinigameRules;
};
```

Schedule in sample `gameConfig.json` rounds twice (once per logical "round per team" in the original idea spec).

### 5.2 Emoji charades content file

Add shared content schema:

- `packages/shared/src/content/emojiCharades/index.ts`

Add sample content:

- `content/sample/minigames/emoji-charades.json`

Schema:

```ts
type EmojiCharadesSubject = {
  id: string;
  text: string;
};

type EmojiCharadesDeck = {
  id: string;
  label: string;
  subjects: EmojiCharadesSubject[];
};

type EmojiCharadesContentFile = {
  decks: EmojiCharadesDeck[];
};
```

Validation rules:

- `decks` required, at least 1 deck.
- Each deck has non-empty `id`, `label`, and `subjects[]`.
- Subject `id`s unique within a deck; deck `id`s unique across the file.
- Each subject has non-empty `id` and `text`.
- Decks with `subjects.length < pointsMax` are loadable but server rejects them at deck-selection time. The validator may warn at load.

Sample content ships with 3–4 starter decks (movies, celebrities, things-around-the-house) covering the cap-met threshold for typical `pointsMax` values.

Example:

```json
{
  "decks": [
    {
      "id": "movies",
      "label": "Movies",
      "subjects": [
        { "id": "titanic", "text": "Titanic" },
        { "id": "jaws", "text": "Jaws" },
        { "id": "rocky", "text": "Rocky" }
      ]
    },
    {
      "id": "celebs",
      "label": "Celebrities",
      "subjects": [
        { "id": "taylor-swift", "text": "Taylor Swift" },
        { "id": "lebron-james", "text": "LeBron James" }
      ]
    }
  ]
}
```

Local override path: `content/local/minigames/emoji-charades.json` (gitignored, optional). Local file overrides sample entirely (same pattern as trivia/geo).

### 5.3 Loader integration

File: `apps/server/src/contentLoader/loadMinigameContent/index.ts`

- Emoji charades runtime plugin declares `content.fileName = "minigames/emoji-charades.json"`.
- Existing plugin content loading path remains unchanged.

## 6) Runtime Contract

File: `packages/minigames/emoji-charades/src/runtime/index.ts`

### 6.1 State model

```ts
type EmojiCharadesSubState = "deck_selection" | "playing" | "turn_complete";

type SubjectReveal = {
  subjectId: string;
  subjectText: string;
  outcome: "CORRECT" | "SKIPPED";
  revealedAtMs: number;
  expiresAtMs: number;
};

type EmojiCharadesRuntimeState = {
  activeTurnTeamId: string | null;
  status: EmojiCharadesSubState;
  selectedDeckId: string | null;
  shuffledSubjectIds: string[];     // populated on selectDeck
  subjectCursor: number;
  emojiSequence: string[];          // current subject's clue
  reveal: SubjectReveal | null;
  pendingPointsByTeamId: Record<string, number>;
};
```

Constants:

- `REVEAL_MS = 2000`
- `MAX_EMOJIS_PER_SUBJECT = 30`

### 6.2 Action types

Use the existing `minigame:action` envelope with bare `actionType` values:

- `selectDeck` — payload `{ deckId: string }`. Valid only in `deck_selection`.
- `appendEmoji` — payload `{ emoji: string }`. Valid only in `playing`.
- `removeEmoji` — payload `{}`. Valid only in `playing`. Removes last emoji.
- `clearEmojis` — payload `{}`. Valid only in `playing`.
- `markCorrect` — payload `{}`. Valid only in `playing`.
- `skipSubject` — payload `{}`. Valid only in `playing`.

### 6.3 Reducer rules

- Ignore actions invalid for the current `status`.
- Ignore actions when runtime state is malformed.
- `selectDeck`:
  - Validate `deckId` exists in content.
  - Validate `deck.subjects.length >= pointsMax`. If not, ignore action (host can intervene via unlocked mode, otherwise the team picks another deck).
  - Set `selectedDeckId`, populate `shuffledSubjectIds` from a shuffle of the deck's subject IDs, set `subjectCursor = 0`, transition to `playing`, clear `emojiSequence` and `reveal`.
- `appendEmoji`:
  - Clear `reveal` if present.
  - If `banLetterEmojis === true`, reject regional-indicator letters and keycap digits silently. (Picker UI doesn't surface them, so this is defense-in-depth.)
  - Append to `emojiSequence` if `emojiSequence.length < MAX_EMOJIS_PER_SUBJECT`.
- `removeEmoji`: pop last emoji.
- `clearEmojis`: empty the array.
- `markCorrect`:
  - Increment active team's pending points by `rules.pointsPerCorrect`, clamp to `pointsMax`.
  - Emit `reveal` with `outcome = CORRECT`, current subject text, `expiresAtMs = now + REVEAL_MS`.
  - Advance `subjectCursor`. If cursor reaches `shuffledSubjectIds.length`, transition to `turn_complete` (degenerate edge case — gate prevents normally).
  - Clear `emojiSequence`.
- `skipSubject`:
  - No score change.
  - Emit `reveal` with `outcome = SKIPPED`.
  - Advance `subjectCursor`. Same termination edge case as above.
  - Clear `emojiSequence`.

### 6.4 Subject rotation

- `subjectCursor` indexes into `shuffledSubjectIds`. No wrap — exhaustion → `turn_complete`.
- `shuffledSubjectIds` is populated only on `selectDeck`. Re-selecting (not allowed in MVP) would require explicit handling.

## 7) Host And Display Projection

Server projections are the only source for `minigameHostView` and `minigameDisplayView`. The display payload must never include the subject text outside the post-result reveal window.

### 7.1 Contract update strategy

Add `EmojiCharadesHostView` and `EmojiCharadesDisplayView` as new outer-union members in `packages/shared/src/roomState/index.ts`. Each is a single member with an internal `status` discriminant (matches the GEO pattern; see [minigame-authoring-guide.md](../minigame-authoring-guide.md) §3 _Display view shape_).

### 7.2 Emoji charades host view

```ts
type EmojiCharadesHostView = {
  minigame: "EMOJI_CHARADES";
  activeTurnTeamId: string | null;
  pendingPointsByTeamId: Record<string, number>;
} & (
  | {
      status: "deck_selection";
      availableDecks: { id: string; label: string; subjectCount: number; isSelectable: boolean }[];
    }
  | {
      status: "playing";
      currentSubject: { id: string; text: string } | null;
      emojiSequence: string[];
      subjectsRemaining: number;
      reveal: SubjectReveal | null;
    }
  | {
      status: "turn_complete";
    }
);
```

`isSelectable` reflects the `deck.subjects.length >= pointsMax` gate so the picker UI can disable too-small decks.

### 7.3 Emoji charades display view

```ts
type EmojiCharadesDisplayView = {
  minigame: "EMOJI_CHARADES";
  activeTurnTeamId: string | null;
  pendingPointsByTeamId: Record<string, number>;
} & (
  | {
      status: "deck_selection";
      availableDecks: { id: string; label: string; subjectCount: number; isSelectable: boolean }[];
    }
  | {
      status: "playing";
      emojiSequence: string[];
      reveal: SubjectReveal | null;
    }
  | {
      status: "turn_complete";
    }
);
```

Display view excludes `currentSubject` and `subjectsRemaining`. The post-result `reveal` includes `subjectText` — that's intentional, only visible during the 2s window.

Display behavior:

- `deck_selection`: show decks list (label + subject count + selectable state) and active team name. No emoji canvas.
- `playing` with `reveal === null` or `now >= reveal.expiresAtMs`: show the live `emojiSequence`, large.
- `playing` with `reveal !== null` and `now < reveal.expiresAtMs`: overlay the resolved subject text + outcome badge for 2s.
- `turn_complete`: show "Time's up" or equivalent end card; phase advance is host-driven.

## 8) Client Rendering Spec

### 8.1 Host (tablet) surface

Files under:

- `packages/minigames/emoji-charades/src/client/HostEmojiCharadesSurface/`

Required UI per `status`:

**`deck_selection`:**
- Active team name banner.
- Vertical list of available decks; each row shows label + subject count.
- Decks failing the `pointsMax` gate render disabled with a "needs more subjects" hint.
- Tapping a row dispatches `selectDeck`.

**`playing`:**
- Subject card at the top of the screen (always visible to picker; never sent to display).
- Emoji canvas below — shows the live `emojiSequence`, with a backspace control to dispatch `removeEmoji` and a clear control for `clearEmojis`.
- Emoji picker — primary surface is **category tabs** (6–8 tabs, hardcoded). Each tab shows a grid of emojis. Tap to dispatch `appendEmoji`.
- Search bar as secondary escape hatch (string contains match against emoji name).
- Two large action buttons at the bottom: **Got It** → `markCorrect`, **Skip** → `skipSubject`.
- Subjects-remaining indicator (small, top-right).

**`turn_complete`:**
- Plain "Turn complete" card; no controls.

Banned-emoji enforcement: the picker filters out regional-indicator letters and keycap digits when `rules.banLetterEmojis === true`. The reducer also enforces this defensively.

### 8.2 Display (TV) surface

Files under:

- `packages/minigames/emoji-charades/src/client/DisplayEmojiCharadesSurface/`

Renders based on `EmojiCharadesDisplayView` status:

- `deck_selection`: large deck cards laid out for room visibility, with "Pick on the tablet" subtitle.
- `playing`: hero emoji sequence (large, center). HUD: timer (top-right, sourced from `RoomTimerState`), active team name, score line per team.
- `playing` + active reveal: overlay the resolved subject text and outcome badge for 2s, then return to live emoji canvas (but the canvas will be cleared by the runtime on next tick).
- `turn_complete`: "Turn complete" + score recap.

### 8.3 Intro surface

Standard intro pattern shared with other minigames: rules summary card, active team name, "Get ready" call-to-action.

## 9) Dev Sandbox Requirements

File: `packages/minigames/emoji-charades/src/dev/index.ts`

Add scenarios:

- Intro idle.
- Deck selection (multiple decks, one disabled by `pointsMax` gate).
- Playing with empty emoji sequence.
- Playing with mid-sequence emojis.
- Playing with active reveal — `CORRECT` outcome.
- Playing with active reveal — `SKIPPED` outcome.
- Turn complete.

## 10) Server And Socket Integration

Existing envelopes already support generic action dispatch. No new socket event names are required.

Key paths:

- `apps/server/src/socketServer/index.ts`
- `apps/server/src/roomState/index.ts`
- `apps/server/src/minigames/runtime/index.ts`

No new server file routes required. Emoji content is plain unicode strings shipped in the JSON content file — no asset hosting.

## 11) Dependency Plan

No new dependencies required.

Optional:
- An emoji metadata library (e.g. `unicode-emoji-json`) for category/search, but the MVP can hardcode a curated 200–300 emoji set across 6–8 tabs without a dependency.

## 12) Testing Plan

### 12.1 Unit tests

- Content validation (missing fields, duplicate IDs, empty decks).
- Runtime reducer behavior per action and per `status`.
- Deck-selection gate: under-sized decks are rejected.
- Banned-emoji rejection in `appendEmoji`.
- Points clamping at `pointsMax`.
- Subject rotation: shuffle on `selectDeck`, cursor advance on resolve, exhaustion → `turn_complete`.
- Display-safe projection: `currentSubject` never appears outside `playing.reveal`.

### 12.2 Component tests

- Host: deck selection renders disabled state for under-sized decks.
- Host: emoji picker filters letter emojis when `banLetterEmojis === true`.
- Host: Got It / Skip dispatch correct actions.
- Display: status-driven rendering across all four states.
- Display: reveal overlay appears for 2s and clears.

### 12.3 E2E tests (Playwright)

- Active team selects a deck on tablet → display transitions out of deck-selection.
- Picker taps emojis on tablet → display sequence updates in real time.
- Got It → score updates, brief reveal flashes on display, next subject loads.
- Skip → no score change, reveal flashes, next subject loads.
- Refresh/reconnect rehydrates current `status`, `emojiSequence`, and `reveal` window.

## 13) Acceptance Criteria

- `EMOJI_CHARADES` runtime no longer returns unsupported stub state.
- Active team selects a deck on the tablet; under-sized decks are not selectable.
- Subjects within a deck are served in random order; no repeats within a turn.
- Display never receives `currentSubject` outside the 2s post-result reveal.
- Got It awards `pointsPerCorrect` (default 1); Skip awards 0; both flash a brief reveal.
- Letter emojis are absent from the picker by default and rejected by the reducer if dispatched.
- Phase timer governs turn length; clean cutoff at zero.
- Existing test suites pass, plus new emoji-charades coverage.

## 14) Incremental Delivery Steps

1. Shared contracts and content schema: `MinigameType` enum addition, `MINIGAME_DEFINITIONS` entry, `GameConfigTimers.emojiCharadesSeconds`, `EmojiCharadesMinigameRules`, `EmojiCharadesHostView` / `EmojiCharadesDisplayView` outer-union members.
2. Sample content file with 3–4 starter decks.
3. Runtime reducer with tests (state machine, scoring, banned-emoji guard, deck gate).
4. Host surface: deck selection screen, emoji picker, Got It / Skip.
5. Display surface: status-driven render, reveal overlay.
6. Dev sandbox scenarios.
7. E2E sync/rehydrate coverage.

## 15) Future Backlog

- Interactive warmup / sandbox sub-state during `MINIGAME_INTRO` (deferred from MVP).
- Recently-used / favorites tab in the emoji picker, persisted across turns within a Wing Night session.
- Per-deck difficulty multiplier.
- Optional max-skip rule (config flag).
- Custom decks authored via the future minigame admin UI (referenced in `song-guess-spec.md` §15).
