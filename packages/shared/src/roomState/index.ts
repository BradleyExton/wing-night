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
};

export type MinigameHostView = {
  minigame: MinigameType;
  activeTurnTeamId: string | null;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
  currentPrompt: TriviaPrompt | null;
};

export type MinigameDisplayView = {
  minigame: MinigameType;
  activeTurnTeamId: string | null;
  promptCursor: number;
  pendingPointsByTeamId: Record<string, number>;
  currentPrompt: Pick<TriviaPrompt, "id" | "question"> | null;
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
};
