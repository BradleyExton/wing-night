import type { FappyMinigameDisplayView, FappyMinigameHostView } from "@wingnight/shared";

import { resolveFinishPoints, resolveTimeToBeat } from "../../runtime/scoring/index.js";
import { resolveSkipPenaltyMs } from "../../runtime/views/index.js";

// Host and display carry identical FAPPY fields (the runtime projects one
// shape into both), so everything below reads the union and neither surface
// gets a second copy of the maths. The runtime imports are the JOUST
// convention — client and runtime are one package, and a scoring curve the
// surfaces re-implemented would be exactly the derived game logic AGENTS.md §6
// bans.
export type FappyRelayView = FappyMinigameHostView | FappyMinigameDisplayView;

// A penalty smaller than this is drift between the server's stamps and this
// device's clock, not a forgiven leg, and is not worth a line on either screen.
const PENALTY_FLOOR_MS = 1000;

export const isRelayOver = (view: FappyRelayView): boolean => {
  return view.phase === "finished" || view.phase === "timedOut";
};

export const isRelayLive = (view: FappyRelayView): boolean => {
  return view.phase === "ready" || view.phase === "flying";
};

export type FinishClock = {
  // What the room should read on a finished relay: the view's own elapsed, the
  // number the score was taken from.
  elapsedMs: number | null;
  // How much of it the skip penalty put there, or 0.
  penaltyMs: number;
  skippedLegs: number;
};

// `useRelayClock` measures the wall between the server's two stamps, which is
// what the room watches while the bird is in the air — but it is NOT what the
// relay scored: `resolveElapsedMs` adds a par-share for every forgiven leg, and
// that sum is what `resolveFinishPoints` was handed. Once the relay is over the
// screens show the scored number, so the time on the plaque and the points
// beside it are the same arithmetic, and say out loud where the difference came
// from rather than leaving a host to wonder why 0:38 paid like 0:50.
export const resolveFinishClock = (
  view: FappyRelayView,
  wallElapsedMs: number | null
): FinishClock => {
  const skippedLegs = view.legs.filter((leg) => leg.skipped).length;

  if (!isRelayOver(view) || view.elapsedMs === null) {
    return { elapsedMs: wallElapsedMs, penaltyMs: 0, skippedLegs };
  }

  const penaltyMs = wallElapsedMs === null ? 0 : view.elapsedMs - wallElapsedMs;

  return {
    elapsedMs: view.elapsedMs,
    penaltyMs: penaltyMs >= PENALTY_FLOOR_MS ? penaltyMs : 0,
    skippedLegs
  };
};

// What a finish RIGHT NOW would pay, for a relay still in the air: the running
// wall clock plus the penalty for every leg already forgiven, down the same
// curve the server will score with. Null before the first flap — there is no
// clock yet, so there is no number — and null once the relay is over, where the
// server's own `points` is the thing to show.
export const resolveLivePoints = (
  view: FappyRelayView,
  wallElapsedMs: number | null
): number | null => {
  if (!isRelayLive(view) || view.startedAtMs === null || wallElapsedMs === null) {
    return null;
  }

  return resolveFinishPoints(wallElapsedMs + resolveSkipPenaltyMs(view), view, view.pointsMax);
};

export type RelayChase = {
  teamId: string;
  points: number;
  // The slowest finish that still tops them, or null when topping them would
  // take better than par — then the only honest instruction is "beat par".
  timeToBeatMs: number | null;
};

// Who the active team is actually racing. The runtime is re-initialised for
// every team turn, so a rival's TIME is gone by the time this team flies — but
// `pendingPointsByTeamId` is the round's running bank and survives, and points
// are all the inversion needs to hand back a time.
export const resolveRelayChase = (view: FappyRelayView): RelayChase | null => {
  const rivals = Object.entries(view.pendingPointsByTeamId).filter(
    ([teamId, points]) => teamId !== view.activeTurnTeamId && points > 0
  );

  if (rivals.length === 0) {
    return null;
  }

  const [teamId, points] = rivals.reduce((best, entry) => (entry[1] > best[1] ? entry : best));

  return { teamId, points, timeToBeatMs: resolveTimeToBeat(points, view, view.pointsMax) };
};
