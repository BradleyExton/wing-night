import type {
  MinigameSurfacePhase
} from "@wingnight/minigames-core";

export type SandboxKnobsState = {
  scenarioId: string;
  phase: MinigameSurfacePhase;
  activeTeamName: string;
  promptVisible: boolean;
  promptQuestion: string;
  promptAnswer: string;
  attemptsRemaining: number;
  pendingPointsForActiveTeam: number;
};
