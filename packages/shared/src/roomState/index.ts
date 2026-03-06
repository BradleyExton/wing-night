import type { GameConfigFile } from "../content/gameConfig/index.js";
import type { GameConfigRound } from "../content/gameConfig/index.js";
import type { MinigameType } from "../content/gameConfig/index.js";
import { MINIGAME_DEFINITIONS } from "../content/gameConfig/index.js";
import type { TriviaPrompt } from "../content/trivia/index.js";
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

export const MINIGAME_ACTION_TYPES = {
  TRIVIA_RECORD_ATTEMPT: "recordAttempt"
} as const;

export type MinigameContractCompatibilityStatus = "COMPATIBLE" | "MISMATCH";

export type MinigameContractMetadata = {
  minigameApiVersion: number;
  capabilityFlags: readonly string[];
};

export const MINIGAME_CONTRACT_METADATA_BY_ID = {
  TRIVIA: MINIGAME_DEFINITIONS.TRIVIA.contractMetadata,
  GEO: MINIGAME_DEFINITIONS.GEO.contractMetadata,
  DRAWING: MINIGAME_DEFINITIONS.DRAWING.contractMetadata
} as const satisfies Record<MinigameType, MinigameContractMetadata>;

type MinigameViewMetadata = {
  minigame: MinigameType;
  minigameApiVersion?: number;
  capabilityFlags?: string[];
  compatibilityStatus?: MinigameContractCompatibilityStatus;
  compatibilityMessage?: string | null;
  status?: "UNSUPPORTED";
  message?: string;
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

export type GeoMinigameHostView = MinigameHostViewBase & {
  minigame: "GEO";
};

export type DrawingMinigameHostView = MinigameHostViewBase & {
  minigame: "DRAWING";
};

export type MinigameHostView =
  | TriviaMinigameHostView
  | GeoMinigameHostView
  | DrawingMinigameHostView;

export type TriviaMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "TRIVIA";
  promptCursor: number;
  currentPrompt: Pick<TriviaPrompt, "id" | "question"> | null;
};

export type GeoMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "GEO";
};

export type DrawingMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "DRAWING";
};

export type MinigameDisplayView =
  | TriviaMinigameDisplayView
  | GeoMinigameDisplayView
  | DrawingMinigameDisplayView;

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
  gameConfig: GameConfigFile | null;
  currentRoundConfig: GameConfigRound | null;
  turnOrderTeamIds: string[];
  roundTurnCursor: number;
  completedRoundTurnTeamIds: string[];
  activeRoundTeamId: string | null;
  activeTurnTeamId: string | null;
  timer: RoomTimerState | null;
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
  | "gameConfig"
  | "currentRoundConfig"
  | "turnOrderTeamIds"
  | "roundTurnCursor"
  | "completedRoundTurnTeamIds"
  | "activeRoundTeamId"
  | "activeTurnTeamId"
  | "timer"
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
  "gameConfig",
  "currentRoundConfig",
  "turnOrderTeamIds",
  "roundTurnCursor",
  "completedRoundTurnTeamIds",
  "activeRoundTeamId",
  "activeTurnTeamId",
  "timer",
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
    gameConfig: roomState.gameConfig,
    currentRoundConfig: roomState.currentRoundConfig,
    turnOrderTeamIds: roomState.turnOrderTeamIds,
    roundTurnCursor: roomState.roundTurnCursor,
    completedRoundTurnTeamIds: roomState.completedRoundTurnTeamIds,
    activeRoundTeamId: roomState.activeRoundTeamId,
    activeTurnTeamId: roomState.activeTurnTeamId,
    timer: roomState.timer,
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
