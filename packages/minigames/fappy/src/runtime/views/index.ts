import type {
  FappyMinigameDisplayView,
  FappyMinigameHostView,
  FappyPhase
} from "@wingnight/shared";

import type { FappyRuntimeState } from "../types/index.js";

// The penalty is the same arithmetic on the state the server holds and on the
// view the surfaces get, and both carry these three fields — so it is typed on
// the fields rather than on the state, and the clock the room watches ticks
// through the very function the score used.
type SkipPenaltyFields = Pick<FappyRuntimeState, "legs" | "legsPerTurn" | "limitSeconds">;

// Derived, never stored: the limit passing or the last gate ends the relay;
// otherwise the room is in whatever state the leg in hand is.
export const resolveFappyPhase = (state: FappyRuntimeState): FappyPhase => {
  if (state.timedOutAtMs !== null) {
    return "timedOut";
  }

  if (state.finishedAtMs !== null || state.legIndex >= state.legsPerTurn) {
    return "finished";
  }

  const status = state.legs[state.legIndex]?.status ?? "ready";

  return status === "flying" ? "flying" : "ready";
};

// A cleared leg counts every gate; the leg in hand counts up to its
// checkpoint, which is the last gate its bird got behind and stayed behind.
//
// A SKIPPED leg reaches `cleared` too — that is what moves the relay on — but
// nobody flew it, so it counts what its bird actually got past rather than the
// full course. Counting it whole had the TV reporting every gate cleared on a
// relay nobody played, and inflated the timeout share, which is scaled by
// exactly this number.
export const resolveTotalGatesCleared = (state: FappyRuntimeState): number => {
  return state.legs.reduce((total, leg) => {
    const flewTheWholeLeg = leg.status === "cleared" && !leg.skipped;

    return total + (flewTheWholeLeg ? state.gatesPerLeg : leg.checkpointGate);
  }, 0);
};

// A skipped leg is forgiven, not free. Nobody flew it, so the relay is charged
// what a leg costs at the LIMIT's pace — one leg's share of the limit. It was
// one leg's share of par, and par is exactly where the curve stops paying
// more: one flap and a skip on every leg finished a second over par and paid
// the whole round, the same as a team that flew every gate. Charged a share of
// the limit, skipping the whole relay lands on the limit, where the curve pays
// its floor, and a skip only saves time for a player stuck far longer than a
// leg should take.
export const resolveSkipPenaltyMs = (state: SkipPenaltyFields): number => {
  const skippedLegs = state.legs.filter((leg) => leg.skipped).length;
  const perLegMs = (state.limitSeconds * 1000) / Math.max(1, state.legsPerTurn);

  return Math.round(skippedLegs * perLegMs);
};

// The relay's time as the score sees it, and as the surfaces report it: wall
// clock from the first flap to the last landing, plus the skip penalty.
export const resolveElapsedMs = (state: FappyRuntimeState): number | null => {
  const endedAtMs = state.timedOutAtMs ?? state.finishedAtMs;

  if (state.startedAtMs === null || endedAtMs === null) {
    return null;
  }

  return Math.max(0, endedAtMs - state.startedAtMs) + resolveSkipPenaltyMs(state);
};

const resolvePoints = (state: FappyRuntimeState): number | null => {
  if (state.activeTurnTeamId === null || (state.finishedAtMs === null && state.timedOutAtMs === null)) {
    return null;
  }

  return Math.max(0, (state.pendingPointsByTeamId[state.activeTurnTeamId] ?? 0) - state.turnStartPoints);
};

// Nothing in a relay is a secret, so the host and display views are the same
// projection; the two exports exist so each outer union gets its own member.
const toFappyViewFields = (state: FappyRuntimeState) => {
  return {
    minigame: "FAPPY" as const,
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    phase: resolveFappyPhase(state),
    legIndex: state.legIndex,
    legsPerTurn: state.legsPerTurn,
    gatesPerLeg: state.gatesPerLeg,
    parSeconds: state.parSeconds,
    limitSeconds: state.limitSeconds,
    legs: state.legs.map((leg) => ({
      ...leg,
      player: leg.player === null ? null : { ...leg.player },
      flapTicks: [...leg.flapTicks],
      knockedEagles: [...leg.knockedEagles],
      lastRun: leg.lastRun === null ? null : { ...leg.lastRun }
    })),
    totalGatesCleared: resolveTotalGatesCleared(state),
    startedAtMs: state.startedAtMs,
    finishedAtMs: state.finishedAtMs,
    timedOutAtMs: state.timedOutAtMs,
    elapsedMs: resolveElapsedMs(state),
    points: resolvePoints(state),
    pointsMax: state.pointsMax
  };
};

export const toFappyHostView = (state: FappyRuntimeState): FappyMinigameHostView => {
  return toFappyViewFields(state);
};

export const toFappyDisplayView = (state: FappyRuntimeState): FappyMinigameDisplayView => {
  return toFappyViewFields(state);
};
