import type { FappyMinigameLeg } from "@wingnight/shared";

export type FappyRuntimeRules = {
  legsPerTurn: number;
  gatesPerLeg: number;
  pointsPerGate: number;
};

export type FappyRuntimeLeg = FappyMinigameLeg;

export type FappyRuntimeState = {
  activeTurnTeamId: string | null;
  legsPerTurn: number;
  gatesPerLeg: number;
  pointsPerGate: number;
  // The leg being flown or waited on; equal to `legsPerTurn` once the relay is over.
  legIndex: number;
  legs: FappyRuntimeLeg[];
  // What the active team had banked before this turn, so `resetTurn` and
  // `redoLeg` can hand back exactly what the turn added and nothing more.
  turnStartPoints: number;
  pendingPointsByTeamId: Record<string, number>;
};

// Four legs covers the biggest team in the sample pack without cycling, and
// thirty-two gates at a point each lands just over the final-round max, so a
// perfect turn tops out and a decent one still feels rewarded.
export const DEFAULT_FAPPY_RULES: FappyRuntimeRules = {
  legsPerTurn: 4,
  gatesPerLeg: 8,
  pointsPerGate: 1
};
