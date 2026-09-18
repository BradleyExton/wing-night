import type { FappyMinigameLeg } from "@wingnight/shared";

export type FappyRuntimeRules = {
  legsPerTurn: number;
  gatesPerLeg: number;
  // Finish at or under par for every point the round offers.
  parSeconds: number;
  // The relay ends here whether or not the team is through.
  limitSeconds: number;
};

export type FappyRuntimeLeg = FappyMinigameLeg;

export type FappyRuntimeState = {
  activeTurnTeamId: string | null;
  legsPerTurn: number;
  gatesPerLeg: number;
  parSeconds: number;
  limitSeconds: number;
  // The leg in hand; equal to `legsPerTurn` once every leg is cleared.
  legIndex: number;
  legs: FappyRuntimeLeg[];
  // Server wall clock: the first flap of the relay, the last gate, or the
  // limit passing. The relay's time is the difference; nothing else is timed.
  startedAtMs: number | null;
  finishedAtMs: number | null;
  timedOutAtMs: number | null;
  // What the active team had banked before this turn, so `resetTurn` can hand
  // back exactly what the turn added and nothing more.
  turnStartPoints: number;
  pendingPointsByTeamId: Record<string, number>;
};

// Four legs covers the biggest team in the sample pack without cycling; eight
// gates a leg is about ten seconds of clean flying, so a clean relay with
// quick handoffs beats par and a couple of crashes a leg still finishes
// inside the limit.
export const DEFAULT_FAPPY_RULES: FappyRuntimeRules = {
  legsPerTurn: 4,
  gatesPerLeg: 8,
  parSeconds: 45,
  limitSeconds: 120
};

// What finishing right at the limit is worth, as a share of the round's max;
// a team that never finishes keeps this share scaled by how far it got.
export const FAPPY_LIMIT_POINTS_SHARE = 0.25;
