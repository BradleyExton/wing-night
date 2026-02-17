import type { GameConfigFile } from "../content/gameConfig/index.js";
import type { GameConfigRound } from "../content/gameConfig/index.js";
import type { Phase } from "../phase/index.js";
import type { Player } from "../player/index.js";
import type { Team } from "../team/index.js";

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
  wingParticipationByPlayerId: Record<string, boolean>;
  pendingWingPointsByTeamId: Record<string, number>;
  pendingMinigamePointsByTeamId: Record<string, number>;
};
