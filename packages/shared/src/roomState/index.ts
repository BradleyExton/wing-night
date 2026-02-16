import type { Phase } from "../phase/index.js";
import type { Player } from "../player/index.js";
import type { Team } from "../team/index.js";

export type RoomState = {
  phase: Phase;
  // 0 means pre-round state; rounds in progress are 1..N.
  currentRound: number;
  players: Player[];
  teams: Team[];
};
