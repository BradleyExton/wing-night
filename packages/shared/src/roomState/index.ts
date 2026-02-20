import type { GameConfigFile } from "../content/gameConfig/index.js";
import type { GameConfigRound } from "../content/gameConfig/index.js";
import type { MinigameType } from "../content/gameConfig/index.js";
import type { TriviaPrompt } from "../content/trivia/index.js";
import type { Phase } from "../phase/index.js";
import type { Player } from "../player/index.js";
import type { Team } from "../team/index.js";

export type RoomTimerState = {
  phase: Phase;
  startedAt: number;
  endsAt: number;
  durationMs: number;
  isPaused: boolean;
  remainingMs: number;
};

type MinigameHostViewBase = {
  minigame: MinigameType;
  activeTurnTeamId: string | null;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
  currentPrompt: TriviaPrompt | null;
};

export type TriviaMinigameHostView = MinigameHostViewBase & {
  minigame: "TRIVIA";
  attemptsRemaining: number;
};

export type UnsupportedMinigameHostView = MinigameHostViewBase & {
  minigame: Exclude<MinigameType, "TRIVIA">;
  attemptsRemaining: number;
  status: "UNSUPPORTED";
  message: string;
};

export type MinigameHostView =
  | TriviaMinigameHostView
  | UnsupportedMinigameHostView;

type MinigameDisplayViewBase = {
  minigame: MinigameType;
  activeTurnTeamId: string | null;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
  currentPrompt: Pick<TriviaPrompt, "id" | "question"> | null;
};

export type TriviaMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: "TRIVIA";
};

export type UnsupportedMinigameDisplayView = MinigameDisplayViewBase & {
  minigame: Exclude<MinigameType, "TRIVIA">;
  status: "UNSUPPORTED";
  message: string;
};

export type MinigameDisplayView =
  | TriviaMinigameDisplayView
  | UnsupportedMinigameDisplayView;

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
