import type { GameConfigFile } from "../content/gameConfig/index.js";
import type { GameConfigRound } from "../content/gameConfig/index.js";
import type { MinigameType } from "../content/gameConfig/index.js";
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
  capabilityFlags: string[];
};

export const MINIGAME_CONTRACT_METADATA_BY_ID: Record<
  MinigameType,
  MinigameContractMetadata
> = {
  TRIVIA: {
    minigameApiVersion: 1,
    capabilityFlags: [MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT]
  },
  GEO: {
    minigameApiVersion: 1,
    capabilityFlags: []
  },
  DRAWING: {
    minigameApiVersion: 1,
    capabilityFlags: []
  }
};

export type MinigameHostView = {
  minigame: MinigameType;
  minigameApiVersion: number;
  capabilityFlags: string[];
  compatibilityStatus: MinigameContractCompatibilityStatus;
  compatibilityMessage: string | null;
  activeTurnTeamId: string | null;
  attemptsRemaining: number;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
  currentPrompt: TriviaPrompt | null;
};

export type MinigameDisplayView = {
  minigame: MinigameType;
  minigameApiVersion: number;
  capabilityFlags: string[];
  activeTurnTeamId: string | null;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
  currentPrompt: Pick<TriviaPrompt, "id" | "question"> | null;
};

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
  triviaPrompts: TriviaPrompt[];
  currentRoundConfig: GameConfigRound | null;
  turnOrderTeamIds: string[];
  roundTurnCursor: number;
  completedRoundTurnTeamIds: string[];
  activeRoundTeamId: string | null;
  activeTurnTeamId: string | null;
  currentTriviaPrompt: TriviaPrompt | null;
  triviaPromptCursor: number;
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

type DisplayUnsafeRoomStateKeys =
  | "triviaPrompts"
  | "currentTriviaPrompt"
  | "minigameHostView";

export type HostRoomStateSnapshot = RoomState;

export type DisplayRoomStateSnapshot = Omit<RoomState, DisplayUnsafeRoomStateKeys>;

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
