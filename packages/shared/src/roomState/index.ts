import type { DrawingPrompt } from "../content/drawing/index.js";
import type { GameConfigFile } from "../content/gameConfig/index.js";
import type { GameConfigRound } from "../content/gameConfig/index.js";
import type { MinigameType } from "../content/gameConfig/index.js";
import type { GeoPrompt } from "../content/geo/index.js";
import type { JoustPrompt } from "../content/joust/index.js";
import type { JoustAim, JoustCollapse, JoustTopple, JoustVec2 } from "../joust/types.js";
import type { RecreatePrompt } from "../content/recreate/index.js";
import type { SchlonicInput, SchlonicOutcome } from "../schlonic/types.js";
import type { SongGuessDifficulty } from "../content/songGuess/index.js";
import type { TriviaPrompt } from "../content/trivia/index.js";
import type { RoomMusicPlaybackState } from "../musicPlayback/index.js";
import type { Phase } from "../phase/index.js";
import type { Player } from "../player/index.js";
import type { SocketClientRole } from "../socketClientRole/index.js";
import type { Team } from "../team/index.js";

export type RoomTimerState = {
  phase: Phase;
  startedAt: number;
  endsAt: number;
  durationMs: number;
  isPaused: boolean;
  remainingMs: number;
};

export type MinigameContractCompatibilityStatus = "COMPATIBLE" | "MISMATCH";

type MinigameViewMetadata = {
  minigame: MinigameType;
  minigameApiVersion?: number;
  capabilityFlags?: string[];
  compatibilityStatus?: MinigameContractCompatibilityStatus;
  compatibilityMessage?: string | null;
};

type MinigameHostViewBase = MinigameViewMetadata & {
  activeTurnTeamId: string | null;
  pendingPointsByTeamId: Record<string, number>;
};

type MinigameDisplayViewBase = MinigameViewMetadata & {
  activeTurnTeamId: string | null;
  pendingPointsByTeamId: Record<string, number>;
};

export type TriviaMinigameHostView = MinigameHostViewBase & {
  minigame: "TRIVIA";
  attemptsRemaining: number;
  promptCursor: number;
  currentPrompt: TriviaPrompt | null;
};

export type GeoMinigameSubState = "guessing" | "submitted";

export type GeoGuessCoordinates = {
  lat: number;
  lng: number;
};

export type GeoPromptResult = {
  promptId: string;
  guessLat: number;
  guessLng: number;
  distanceKm: number;
  pointsAwarded: number;
};

export type GeoMinigameHostPrompt = Pick<
  GeoPrompt,
  "id" | "title" | "imageSrc" | "hint"
> & {
  answerLat: number;
  answerLng: number;
};

export type GeoMinigameDisplayPrompt = Pick<
  GeoPrompt,
  "id" | "title" | "imageSrc" | "hint"
>;

export type GeoMinigameHostView = MinigameHostViewBase & {
  minigame: "GEO";
  promptsPerTurn: number;
  promptsCompletedThisTurn: number;
  currentSubState: GeoMinigameSubState;
  currentGuess: GeoGuessCoordinates | null;
  currentPrompt: GeoMinigameHostPrompt | null;
  lastResult: GeoPromptResult | null;
};

export type GeoMinigameDisplayResult = {
  guessLat: number;
  guessLng: number;
  answerLat: number;
  answerLng: number;
  distanceKm: number;
  pointsAwarded: number;
};

// `currentGuess` is the team's own in-progress pin, projected so the TV can
// show it land while the table argues. It is not a disclosure: the pin is the
// room's own input, already on the tablet in front of them. The ANSWER
// coordinates stay host-only until the guess is locked in, which is what the
// answer-safety tests pin.
export type GeoMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "GEO";
  promptsPerTurn: number;
  promptsCompletedThisTurn: number;
  currentPrompt: GeoMinigameDisplayPrompt | null;
  currentGuess: GeoGuessCoordinates | null;
} & (
    | { status: "guessing" }
    | { status: "submitted"; result: GeoMinigameDisplayResult }
  );

// A RECREATE target runs writing -> judging -> scored, host-paced.
export type RecreateSubState = "writing" | "judging" | "scored";

// What became of the team's prompt once it was sent to the image model.
// `skipped` is the offline path: the rules turned live generation off, so the
// room judges the prompt as read aloud and no picture is expected.
export type RecreateAttemptStatus = "generating" | "ready" | "failed" | "skipped";

export type RecreateAttempt = {
  attemptId: string;
  prompt: string;
  status: RecreateAttemptStatus;
  // Pack-relative once generated (`recreate/attempts/…`), null until then.
  imageSrc: string | null;
  failureReason: string | null;
};

// Both surfaces see the target itself; only the checklist and the authored
// prompt are staged.
export type RecreateMinigameTarget = Pick<
  RecreatePrompt,
  "id" | "title" | "targetImageSrc"
> & {
  sourceImageSrc: string | null;
};

// The rubric, present on the host view from the moment the team submits.
// Absent while writing, because in PASS_AND_PLAY the tablet is in the team's
// hands and the ingredients are the answer.
export type RecreateChecklist = {
  ingredients: string[];
  checkedIngredientIndexes: number[];
  authoredPrompt: string;
};

type RecreateMinigameViewFields = {
  minigame: "RECREATE";
  subState: RecreateSubState;
  targetsPerTurn: number;
  targetsCompletedThisTurn: number;
  pointsPerIngredient: number;
  liveGeneration: boolean;
  currentTarget: RecreateMinigameTarget | null;
  attempt: RecreateAttempt | null;
  lastPointsAwarded: number | null;
};

export type RecreateMinigameHostView = MinigameHostViewBase &
  RecreateMinigameViewFields & {
    checklist: RecreateChecklist | null;
  };

// The display's copy of the rubric lags the host's by one beat: the
// ingredients appear once the prompt is in (they are no longer an answer the
// team could use), the authored prompt only once the score is locked.
export type RecreateMinigameDisplayView = MinigameDisplayViewBase &
  RecreateMinigameViewFields & {
    ingredients: string[] | null;
    checkedIngredientIndexes: number[];
    authoredPrompt: string | null;
  };

export type DrawingPoint = {
  // Normalized 0–1 coordinates; the capture surface and the display canvas
  // each scale to their own pixel dimensions.
  x: number;
  y: number;
  t: number;
};

export type DrawingStroke = {
  strokeId: string;
  points: DrawingPoint[];
  color: string;
  // Brush size normalized against canvas height, like point coordinates.
  size: number;
};

export type DrawingPromptOutcome = "CORRECT" | "INCORRECT";

export type DrawingPromptReveal = {
  promptId: string;
  promptText: string;
  outcome: DrawingPromptOutcome;
  revealedAtMs: number;
  expiresAtMs: number;
};

export type DrawingMinigameHostPrompt = Pick<DrawingPrompt, "id" | "prompt">;

export type DrawingMinigameHostView = MinigameHostViewBase & {
  minigame: "DRAWING";
  promptCursor: number;
  currentPrompt: DrawingMinigameHostPrompt | null;
  strokes: DrawingStroke[];
  activeStrokeId: string | null;
  reveal: DrawingPromptReveal | null;
};

export type SongGuessPhase =
  | "idle"
  | "clip_playing"
  | "clip_paused"
  | "reveal"
  | "done";

// `null` means the host has not ruled on that half of the answer yet, which is
// distinct from having ruled it wrong.
export type SongGuessMark = boolean | null;

export type SongGuessTeamScore = {
  title: SongGuessMark;
  artist: SongGuessMark;
};

export type SongGuessMinigameHostSong = {
  id: string;
  audioFileName: string;
  clipStart: number;
  clipEnd: number;
  revealStart: number;
  correctTitle: string;
  correctArtist: string;
  difficulty?: SongGuessDifficulty;
  hint?: string;
};

export type SongGuessMinigameHostView = MinigameHostViewBase & {
  minigame: "SONG_GUESS";
  phase: SongGuessPhase;
  songCursor: number;
  songsTotal: number;
  replayUsed: boolean;
  currentSong: SongGuessMinigameHostSong | null;
  currentScore: SongGuessTeamScore;
  scoresBySongId: Record<string, SongGuessTeamScore>;
};

export type EmojiCharadesSubState =
  | "deck_selection"
  | "playing"
  | "turn_complete";

export type EmojiCharadesSubjectOutcome = "CORRECT" | "SKIPPED";

export type EmojiCharadesSubjectReveal = {
  subjectId: string;
  subjectText: string;
  outcome: EmojiCharadesSubjectOutcome;
  revealedAtMs: number;
  expiresAtMs: number;
};

// `isSelectable` mirrors the deck.subjects.length >= pointsMax gate, so the
// picker can disable an undersized deck instead of dispatching a selectDeck
// the reducer will refuse.
export type EmojiCharadesDeckOption = {
  id: string;
  label: string;
  subjectCount: number;
  isSelectable: boolean;
};

export type EmojiCharadesMinigameHostSubject = {
  id: string;
  text: string;
};

export type EmojiCharadesMinigameHostView = MinigameHostViewBase & {
  minigame: "EMOJI_CHARADES";
} & (
    | {
        status: "deck_selection";
        availableDecks: EmojiCharadesDeckOption[];
      }
    | {
        status: "playing";
        currentSubject: EmojiCharadesMinigameHostSubject | null;
        emojiSequence: string[];
        subjectsRemaining: number;
        reveal: EmojiCharadesSubjectReveal | null;
      }
    | {
        // The turn's last verdict lands here, so the reveal rides along: without it the
        // room never learns the final subject's answer.
        status: "turn_complete";
        reveal: EmojiCharadesSubjectReveal | null;
      }
  );

export type JoustPhase = "aiming" | "resolved" | "done";

// One player in the lane or on the bench: everything the cast bird (DESIGN.md §2.8) needs to be
// drawn as them. `avatarSrc` stays PACK-RELATIVE here; the surface that renders it resolves it
// against the server origin, because the client and server are always separate origins. `teamId`
// and `genre` are the bird's colour and its apparel — carried as the data they are, so the
// runtime never has to name a UI class.
export type JoustPlayerFigure = {
  playerId: string;
  name: string;
  avatarSrc: string | null;
  teamId: string | null;
  genre: string | null;
};

export type JoustShotResult = {
  shotNumber: number;
  // Who went over on this shot, in the order they fell.
  toppledPlayerIds: string[];
  // Which towers the shot brought down, by index into the lane's perches. Everyone stood on one
  // is in `toppledPlayerIds` too; this is what lets the plaque shout "Timber!".
  collapsedPerchIndices: number[];
  // The shot left nobody standing — bowling's strike, and the only bonus in the game.
  isRackCleared: boolean;
  // A player is worth what their perch is worth (`resolveJoustPerchPoints`): one on the sand,
  // more up a tower. Plus the bonus for a cleared rack.
  points: number;
};

// The integrator's `JoustShotRun` with its readonly arrays relaxed: room state
// is plain mutable JSON, and the runtime copies a run into this shape when it
// stores one. Frames are flat `[x0, y0, x1, y1, ...]` in JOUST_BODIES order.
export type JoustShotTrack = {
  keyframeHz: number;
  keyframes: number[][];
  topples: JoustTopple[];
  collapses: JoustCollapse[];
};

// The shot the TV is replaying (or has just replayed): its outcome plus the
// server-simulated keyframe track. Only the latest shot carries a track, so
// the snapshot never holds more than one.
export type JoustMinigameShot = JoustShotResult & {
  aim: JoustAim;
  run: JoustShotTrack;
  // The rack this track was simulated against, in frame order: `run.topples[n].pinIndex` and every
  // pin body in a keyframe index into THIS list, not into the lineup. It is the standing set as it
  // was before the shot, which is not the standing set after it.
  pinPlayerIds: string[];
  // Towers already lying in rubble when this shot was fired. Their legs have no bodies in the
  // track, the same way a felled player has no pin in it.
  rubblePerchIndices: number[];
};

// The shot before this one, kept while the next teammate aims: where the band was pulled to and
// the arc the head flew, up to its first contact. It is what turns a team's shots from three
// guesses into three adjustments. Client-drawn only; the integrator never sees it.
export type JoustShotGhost = {
  shotNumber: number;
  aim: JoustAim;
  path: JoustVec2[];
};

export type JoustMinigameArena = Pick<
  JoustPrompt,
  "id" | "name" | "perches" | "obstacles"
>;

// Nothing about a joust is secret — the arena is on the TV by design — so the
// host and display carry the same fields. Kept as two members of the outer
// unions so each stays exactly one entry per minigame.
type JoustMinigameViewFields = {
  minigame: "JOUST";
  phase: JoustPhase;
  arena: JoustMinigameArena | null;
  // Every player NOT on the shooting team, in the order they are racked up. Locked when the turn
  // starts, so the columns hold still as the rack thins out.
  lineup: JoustPlayerFigure[];
  // The shooting team, stood behind the slingshot. Scenery that says whose turn it is.
  teammates: JoustPlayerFigure[];
  // Everyone the turn has already put on the sand; they sit out the remaining shots.
  downPlayerIds: string[];
  // Every tower the turn has already brought down, by index into the lane's perches. Rubble for
  // the rest of the turn: drawn flat, built for nothing, and nobody is stood on it.
  collapsedPerchIndices: number[];
  // The last shot's arc and pull, shown while the next one is aimed. Null on the first shot.
  previousShotGhost: JoustShotGhost | null;
  // Whose hand is on the band right now. Everybody on the team takes a turn, in roster order, so
  // this walks the bench as the turn goes on.
  activeShooterPlayerId: string | null;
  shotsPerTurn: number;
  // 0-based index of the shot being aimed or just resolved.
  shotIndex: number;
  // The live pull on the band while aiming; a slack band is { x: 0, y: 0 }.
  aim: JoustAim;
  shots: JoustShotResult[];
  lastShot: JoustMinigameShot | null;
};

export type JoustMinigameHostView = MinigameHostViewBase & JoustMinigameViewFields;

export type FappyLegStatus = "ready" | "flying" | "cleared";

export type FappyPhase = "ready" | "flying" | "finished" | "timedOut";

// The server's own re-run of one attempt's flap log, kept so the display can
// hold the crash or the landing until the next attempt starts.
export type FappyLegRunResult = {
  endTick: number;
  gatesCleared: number;
  outcome: "cleared" | "crashed";
};

// One leg of the relay: whose bird, which course, where the current attempt
// starts from and the flap log the display re-runs the shared sim from. A
// crash does not end a leg — it starts the next attempt on the perch of the
// last gate cleared — so the relay always reaches the end; it only takes time.
// One player as the cast bird needs them drawn (the JOUST convention):
// `avatarSrc` stays pack-relative and the surface resolves it against the
// server origin; team id and genre are the bird's colour and apparel.
export type FappyPlayerFigure = {
  playerId: string;
  name: string;
  avatarSrc: string | null;
  teamId: string | null;
  genre: string | null;
};

export type FappyMinigameLeg = {
  legIndex: number;
  // Whose leg it is; null flies the drawn hen in the team colour.
  player: FappyPlayerFigure | null;
  seed: number;
  status: FappyLegStatus;
  // 0 for the first attempt; climbs with every crash. Keys the surfaces' local runs.
  attempt: number;
  // How many gates the attempt starts behind: 0 at the start line.
  checkpointGate: number;
  flapTicks: number[];
  crashes: number;
  skipped: boolean;
  // Gates whose eagle the bird has bumped out of the sky this leg; they stay
  // gone on every later attempt, which is what makes a bump a mercy.
  knockedEagles: number[];
  lastRun: FappyLegRunResult | null;
};

// Nothing about a relay is secret — every leg is on the TV as it happens — so
// the host and display carry the same fields, as JOUST does. Timestamps are
// the server's wall clock; a surface renders a running clock against its own
// and the score only ever comes from the server's numbers.
type FappyMinigameViewFields = {
  minigame: "FAPPY";
  phase: FappyPhase;
  legIndex: number;
  legsPerTurn: number;
  gatesPerLeg: number;
  parSeconds: number;
  limitSeconds: number;
  legs: FappyMinigameLeg[];
  totalGatesCleared: number;
  startedAtMs: number | null;
  finishedAtMs: number | null;
  timedOutAtMs: number | null;
  // The relay's time once it is over, and what it scored; null while it runs.
  elapsedMs: number | null;
  points: number | null;
};
export type FappyMinigameHostView = MinigameHostViewBase & FappyMinigameViewFields;

export type SchlonicRunStatus = "ready" | "running" | "done";

export type SchlonicPhase = "ready" | "running" | "finished";

// The server's own re-run of one run's input log: the only reading of a run that scores.
export type SchlonicRunResult = {
  outcome: SchlonicOutcome;
  endTick: number;
  rings: number;
  distance: number;
};

// One player as the runner needs them named (the JOUST convention): `avatarSrc` stays
// pack-relative and the surface resolves it against the server origin; team id and genre are
// the schlong's colour and the crowd's apparel.
export type SchlonicPlayerFigure = {
  playerId: string;
  name: string;
  avatarSrc: string | null;
  teamId: string | null;
  genre: string | null;
};

// One player's run at the zone. There is no second attempt: a run ends at the post or it ends
// where it went wrong, and either way the tablet moves on. The input log is what the display
// re-runs the shared sim from, and what the server refereed the result out of.
export type SchlonicMinigameRun = {
  runIndex: number;
  // Whose run it is; null runs the house schlong in the team colour.
  player: SchlonicPlayerFigure | null;
  status: SchlonicRunStatus;
  inputs: SchlonicInput[];
  skipped: boolean;
  result: SchlonicRunResult | null;
};

// Nothing about a run is secret — the whole zone is on the TV as it happens — so the host and
// display carry the same fields, as JOUST and FAPPY do. The zone is a RULE, not a roll: every
// team in the round runs the same one, so the night is a race rather than a lottery.
type SchlonicMinigameViewFields = {
  minigame: "SCHLONIC";
  phase: SchlonicPhase;
  runIndex: number;
  runsPerTurn: number;
  zoneSeed: number;
  zoneChunks: number;
  parRingsPerRun: number;
  runs: SchlonicMinigameRun[];
  // What the team has brought home so far, and what it would need for the round's full points.
  ringsBanked: number;
  ringsPar: number;
  points: number | null;
};

export type SchlonicMinigameHostView = MinigameHostViewBase & SchlonicMinigameViewFields;

export type MinigameHostView =
  | TriviaMinigameHostView
  | GeoMinigameHostView
  | SongGuessMinigameHostView
  | JoustMinigameHostView
  | FappyMinigameHostView
  | SchlonicMinigameHostView
  | RecreateMinigameHostView
  | DrawingMinigameHostView
  | EmojiCharadesMinigameHostView;

export type TriviaMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "TRIVIA";
  promptCursor: number;
  // Not an answer — a count of questions the team has left. TRIVIA is
  // host-paced, so the TV has no clock to tell the room the turn is over; the
  // count reaching zero is the only signal it gets.
  attemptsRemaining: number;
  currentPrompt: Pick<TriviaPrompt, "id" | "question"> | null;
};

// Answer-safe: the display never receives the current prompt; prompt text
// only appears via `reveal` after the tablet resolves the prompt.
export type DrawingMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "DRAWING";
  strokes: DrawingStroke[];
  reveal: DrawingPromptReveal | null;
};

// The clip the TV plays. Carrying the audio filename is the same class of
// disclosure as GEO's `imageSrc`: an asset the display must fetch to render the
// round at all. The ANSWER fields — title and artist — stay host-only until the
// host triggers the reveal, which is what the answer-safety tests pin.
export type SongGuessMinigameDisplayClip = {
  audioFileName: string;
  clipStart: number;
  clipEnd: number;
};

export type SongGuessMinigameDisplayReveal = {
  title: string;
  artist: string;
  audioFileName: string;
  revealStart: number;
};

export type SongGuessMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "SONG_GUESS";
  songCursor: number;
  songsTotal: number;
  // Not an answer — the TV needs it to tell a replay (restart from the top)
  // apart from a resume after the host paused mid-clip.
  replayUsed: boolean;
} & (
    // `idle` carries the clip too so the TV can preload the file before the
    // host presses play, rather than buffering into the first bar.
    | {
        phase: "idle" | "clip_playing" | "clip_paused";
        clip: SongGuessMinigameDisplayClip;
      }
    | { phase: "reveal"; reveal: SongGuessMinigameDisplayReveal }
    | { phase: "done" }
  );

// Answer-safe: the display never receives `currentSubject`. Subject text
// reaches the TV only inside `reveal`, after the tablet resolves it.
export type EmojiCharadesMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "EMOJI_CHARADES";
} & (
    | {
        status: "deck_selection";
        availableDecks: EmojiCharadesDeckOption[];
      }
    | {
        status: "playing";
        emojiSequence: string[];
        reveal: EmojiCharadesSubjectReveal | null;
      }
    | {
        // The turn's last verdict lands here, so the reveal rides along: without it the
        // room never learns the final subject's answer.
        status: "turn_complete";
        reveal: EmojiCharadesSubjectReveal | null;
      }
  );

export type JoustMinigameDisplayView = MinigameDisplayViewBase & JoustMinigameViewFields;

export type FappyMinigameDisplayView = MinigameDisplayViewBase & FappyMinigameViewFields;

export type SchlonicMinigameDisplayView = MinigameDisplayViewBase & SchlonicMinigameViewFields;

export type MinigameDisplayView =
  | TriviaMinigameDisplayView
  | GeoMinigameDisplayView
  | SongGuessMinigameDisplayView
  | JoustMinigameDisplayView
  | FappyMinigameDisplayView
  | SchlonicMinigameDisplayView
  | RecreateMinigameDisplayView
  | DrawingMinigameDisplayView
  | EmojiCharadesMinigameDisplayView;

export type RoomFatalError = {
  code: "CONTENT_LOAD_FAILED";
  message: string;
};

export type RoomState = {
  phase: Phase;
  // 0 means pre-round state; rounds in progress are 1..N.
  currentRound: number;
  // Total rounds scheduled for the active game.
  totalRounds: number;
  players: Player[];
  teams: Team[];
  // Filenames under `content/local/audio/lobby/`, in playback order. Boot
  // content, not gameplay state: it is seeded by the content load and then
  // never mutated by a phase advance.
  lobbyPlaylist: string[];
  gameConfig: GameConfigFile | null;
  currentRoundConfig: GameConfigRound | null;
  turnOrderTeamIds: string[];
  roundTurnCursor: number;
  completedRoundTurnTeamIds: string[];
  activeRoundTeamId: string | null;
  activeTurnTeamId: string | null;
  timer: RoomTimerState | null;
  // What the TV's speaker is doing, and whether it is doing it. Server-owned
  // for the same reason `timer` is: the host can pause and skip, so playback
  // is a mutation target rather than something the display derives.
  musicPlayback: RoomMusicPlaybackState | null;
  // The TV's master volume, 0–1. Deliberately NOT inside `musicPlayback`: that
  // slot is null on every silent phase, and the host's volume has to survive
  // EATING as well as a reset and a display refresh.
  musicVolume: number;
  minigameHostView: MinigameHostView | null;
  minigameDisplayView: MinigameDisplayView | null;
  wingParticipationByPlayerId: Record<string, boolean>;
  pendingWingPointsByTeamId: Record<string, number>;
  pendingMinigamePointsByTeamId: Record<string, number>;
  fatalError: RoomFatalError | null;
  canRedoScoringMutation: boolean;
  canAdvancePhase: boolean;
};

type DisplaySafeRoomStateKeys =
  | "phase"
  | "currentRound"
  | "totalRounds"
  | "players"
  | "teams"
  | "lobbyPlaylist"
  | "gameConfig"
  | "currentRoundConfig"
  | "turnOrderTeamIds"
  | "roundTurnCursor"
  | "completedRoundTurnTeamIds"
  | "activeRoundTeamId"
  | "activeTurnTeamId"
  | "timer"
  | "musicPlayback"
  | "musicVolume"
  | "minigameDisplayView"
  | "wingParticipationByPlayerId"
  | "pendingWingPointsByTeamId"
  | "pendingMinigamePointsByTeamId"
  | "fatalError"
  | "canRedoScoringMutation"
  | "canAdvancePhase";

export const DISPLAY_SAFE_ROOM_STATE_KEYS = [
  "phase",
  "currentRound",
  "totalRounds",
  "players",
  "teams",
  "lobbyPlaylist",
  "gameConfig",
  "currentRoundConfig",
  "turnOrderTeamIds",
  "roundTurnCursor",
  "completedRoundTurnTeamIds",
  "activeRoundTeamId",
  "activeTurnTeamId",
  "timer",
  "musicPlayback",
  "musicVolume",
  "minigameDisplayView",
  "wingParticipationByPlayerId",
  "pendingWingPointsByTeamId",
  "pendingMinigamePointsByTeamId",
  "fatalError",
  "canRedoScoringMutation",
  "canAdvancePhase"
] as const satisfies readonly DisplaySafeRoomStateKeys[];

type DisplaySafeRoomStateKey = (typeof DISPLAY_SAFE_ROOM_STATE_KEYS)[number];

export type HostRoomStateSnapshot = RoomState;

export type DisplayRoomStateSnapshot = Pick<RoomState, DisplaySafeRoomStateKey>;

export type RoleScopedStateSnapshotEnvelope =
  | {
      clientRole: "HOST";
      roomState: HostRoomStateSnapshot;
    }
  | {
      clientRole: "DISPLAY";
      roomState: DisplayRoomStateSnapshot;
    };

export type RoleScopedSnapshotByRole<TRole extends SocketClientRole> = Extract<
  RoleScopedStateSnapshotEnvelope,
  { clientRole: TRole }
>["roomState"];

export const toDisplayRoomStateSnapshot = (
  roomState: RoomState
): DisplayRoomStateSnapshot => {
  const displaySnapshot = {
    phase: roomState.phase,
    currentRound: roomState.currentRound,
    totalRounds: roomState.totalRounds,
    players: roomState.players,
    teams: roomState.teams,
    lobbyPlaylist: roomState.lobbyPlaylist,
    gameConfig: roomState.gameConfig,
    currentRoundConfig: roomState.currentRoundConfig,
    turnOrderTeamIds: roomState.turnOrderTeamIds,
    roundTurnCursor: roomState.roundTurnCursor,
    completedRoundTurnTeamIds: roomState.completedRoundTurnTeamIds,
    activeRoundTeamId: roomState.activeRoundTeamId,
    activeTurnTeamId: roomState.activeTurnTeamId,
    timer: roomState.timer,
    // A track title is not privileged information, so the whole of it goes to
    // the display: the TV is the surface that has to render the strip.
    musicPlayback: roomState.musicPlayback,
    musicVolume: roomState.musicVolume,
    minigameDisplayView: roomState.minigameDisplayView,
    wingParticipationByPlayerId: roomState.wingParticipationByPlayerId,
    pendingWingPointsByTeamId: roomState.pendingWingPointsByTeamId,
    pendingMinigamePointsByTeamId: roomState.pendingMinigamePointsByTeamId,
    fatalError: roomState.fatalError,
    canRedoScoringMutation: roomState.canRedoScoringMutation,
    canAdvancePhase: roomState.canAdvancePhase
  } satisfies DisplayRoomStateSnapshot;

  return displaySnapshot;
};

export function toRoleScopedSnapshotEnvelope(
  clientRole: "HOST",
  roomState: RoomState
): { clientRole: "HOST"; roomState: HostRoomStateSnapshot };
export function toRoleScopedSnapshotEnvelope(
  clientRole: "DISPLAY",
  roomState: RoomState
): { clientRole: "DISPLAY"; roomState: DisplayRoomStateSnapshot };
export function toRoleScopedSnapshotEnvelope(
  clientRole: SocketClientRole,
  roomState: RoomState
): RoleScopedStateSnapshotEnvelope;
export function toRoleScopedSnapshotEnvelope(
  clientRole: SocketClientRole,
  roomState: RoomState
): RoleScopedStateSnapshotEnvelope {
  if (clientRole === "HOST") {
    return {
      clientRole: "HOST",
      roomState
    };
  }

  return {
    clientRole: "DISPLAY",
    roomState: toDisplayRoomStateSnapshot(roomState)
  };
}
