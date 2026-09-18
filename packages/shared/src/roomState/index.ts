import type { DrawingPrompt } from "../content/drawing/index.js";
import type { GameConfigFile } from "../content/gameConfig/index.js";
import type { GameConfigRound } from "../content/gameConfig/index.js";
import type { MinigameType } from "../content/gameConfig/index.js";
import type { GeoPrompt } from "../content/geo/index.js";
import type { JoustPrompt } from "../content/joust/index.js";
import type { JoustAim, JoustHitZone } from "../joust/types.js";
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

export type GeoMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "GEO";
  promptsPerTurn: number;
  promptsCompletedThisTurn: number;
  currentPrompt: GeoMinigameDisplayPrompt | null;
} & (
    | { status: "guessing" }
    | { status: "submitted"; result: GeoMinigameDisplayResult }
  );

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
    | { status: "turn_complete" }
  );

export type JoustPhase = "aiming" | "resolved" | "done";

export type JoustShotResult = {
  shotNumber: number;
  hitZone: JoustHitZone | null;
  points: number;
};

// The integrator's `JoustShotRun` with its readonly arrays relaxed: room state
// is plain mutable JSON, and the runtime copies a run into this shape when it
// stores one. Frames are flat `[x0, y0, x1, y1, ...]` in JOUST_BODIES order.
export type JoustShotTrack = {
  keyframeHz: number;
  keyframes: number[][];
  hitZone: JoustHitZone | null;
  hitFrameIndex: number | null;
};

// The shot the TV is replaying (or has just replayed): its outcome plus the
// server-simulated keyframe track. Only the latest shot carries a track, so
// the snapshot never holds more than one.
export type JoustMinigameShot = JoustShotResult & {
  aim: JoustAim;
  run: JoustShotTrack;
};

export type JoustMinigameArena = Pick<
  JoustPrompt,
  "id" | "name" | "targetX" | "obstacles"
>;

// Nothing about a joust is secret — the arena is on the TV by design — so the
// host and display carry the same fields. Kept as two members of the outer
// unions so each stays exactly one entry per minigame.
type JoustMinigameViewFields = {
  minigame: "JOUST";
  phase: JoustPhase;
  arena: JoustMinigameArena | null;
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
export type FappyMinigameLeg = {
  legIndex: number;
  playerId: string | null;
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

export type MinigameHostView =
  | TriviaMinigameHostView
  | GeoMinigameHostView
  | SongGuessMinigameHostView
  | JoustMinigameHostView
  | FappyMinigameHostView
  | DrawingMinigameHostView
  | EmojiCharadesMinigameHostView;

export type TriviaMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "TRIVIA";
  promptCursor: number;
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
    | { status: "turn_complete" }
  );

export type JoustMinigameDisplayView = MinigameDisplayViewBase & JoustMinigameViewFields;

export type FappyMinigameDisplayView = MinigameDisplayViewBase & FappyMinigameViewFields;

export type MinigameDisplayView =
  | TriviaMinigameDisplayView
  | GeoMinigameDisplayView
  | SongGuessMinigameDisplayView
  | JoustMinigameDisplayView
  | FappyMinigameDisplayView
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
