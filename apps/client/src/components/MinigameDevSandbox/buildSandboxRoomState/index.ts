import {
  Phase,
  type MinigameDisplayView,
  type MinigameHostView,
  type MinigameType,
  type RoomState
} from "@wingnight/shared";
import type { MinigameSurfacePhase } from "@wingnight/minigames-core";

type BuildSandboxRoomStateInput = {
  minigameType: MinigameType;
  minigamePhase: MinigameSurfacePhase;
  activeTeamName: string;
  minigameHostView: MinigameHostView | null;
  minigameDisplayView: MinigameDisplayView | null;
};

export const buildSandboxRoomState = ({
  minigameType,
  minigamePhase,
  activeTeamName,
  minigameHostView,
  minigameDisplayView
}: BuildSandboxRoomStateInput): RoomState => {
  const activeTeamId = "team-alpha";

  return {
    phase:
      minigamePhase === "intro" ? Phase.MINIGAME_INTRO : Phase.MINIGAME_PLAY,
    currentRound: 1,
    totalRounds: 3,
    players: [
      { id: "player-1", name: "Alex" },
      { id: "player-2", name: "Morgan" },
      { id: "player-3", name: "Taylor" },
      { id: "player-4", name: "Jordan" }
    ],
    teams: [
      {
        id: activeTeamId,
        name: activeTeamName,
        playerIds: ["player-1", "player-2"],
        totalScore: 11
      },
      {
        id: "team-beta",
        name: "Team Beta",
        playerIds: ["player-3", "player-4"],
        totalScore: 9
      }
    ],
    gameConfig: null,
    currentRoundConfig: {
      round: 1,
      label: "Sandbox",
      sauce: "Buffalo",
      pointsPerPlayer: 2,
      minigame: minigameType
    },
    turnOrderTeamIds: [activeTeamId, "team-beta"],
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: activeTeamId,
    activeTurnTeamId: minigameHostView?.activeTurnTeamId ?? activeTeamId,
    timer: null,
    minigameHostView,
    minigameDisplayView,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId:
      minigameHostView === null ? {} : { ...minigameHostView.pendingPointsByTeamId },
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: true
  };
};
