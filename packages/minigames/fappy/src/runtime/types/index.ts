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
  // What a finish at or under par pays, handed in at `initialize` and held so
  // the projection can carry it to the surfaces. The runtime is re-initialised
  // for every team turn and a round's max does not move inside one, so there is
  // nothing here for a reducer to keep in step.
  pointsMax: number;
  // What the active team had banked before this turn, so `resetTurn` can hand
  // back exactly what the turn added and nothing more.
  turnStartPoints: number;
  pendingPointsByTeamId: Record<string, number>;
};

// Measured against a greedy autopilot on the shared sim: a flawless six-gate
// leg takes 8.8 s and each handoff costs the relay a further 1.4 s of
// client-side beat, so four legs is 39 s of perfect flying before a human
// reacts. Par sits above that at 50 s — reachable, not free — and the limit at
// twice a clean leg's worth beyond it. These are the SAMPLE's numbers; a pack
// with deeper teams carries its own `legsPerTurn` (CLAUDE.md, the night pack),
// which is why nothing here is sized to a particular roster.
export const DEFAULT_FAPPY_RULES: FappyRuntimeRules = {
  legsPerTurn: 4,
  gatesPerLeg: 6,
  parSeconds: 50,
  limitSeconds: 100
};

// What finishing right at the limit is worth, as a share of the round's max;
// a team that never finishes keeps this share scaled by how far it got. A
// tenth, not a quarter: over a 50 s slide a quarter made the curve so shallow
// that a four-second crash cost less than a single point out of twenty, so
// the clock the whole game is built on did not show up in the score.
export const FAPPY_LIMIT_POINTS_SHARE = 0.1;
