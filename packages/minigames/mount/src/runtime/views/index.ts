import type {
  MountMinigameDisplayView,
  MountMinigameHostView,
  MountPhase,
  MountPile,
  MountPileHen
} from "@wingnight/shared";

import { resolveShareBanked } from "../scoring/index.js";
import type { MountRuntimeState } from "../types/index.js";

const clonePileHen = (hen: MountPileHen): MountPileHen => {
  const pose = { ...hen.pose };

  for (const particle of Object.keys(pose) as (keyof MountPileHen["pose"])[]) {
    pose[particle] = { ...pose[particle] };
  }

  const grabs: MountPileHen["grabs"] = {};

  for (const [limb, at] of Object.entries(hen.grabs) as [keyof MountPileHen["grabs"], { x: number; y: number }][]) {
    grabs[limb] = { ...at };
  }

  return { ...hen, pose, grabs };
};

/** A copy of a pile, so no view or memory shares an object with the state. */
export const clonePile = (pile: MountPile): MountPile => {
  return { ...pile, hens: pile.hens.map(clonePileHen), highLine: { ...pile.highLine } };
};

// Derived, never stored: the team is through once every climb is behind it; otherwise the room is
// in whatever state the climb in hand is.
export const resolveMountPhase = (state: MountRuntimeState): MountPhase => {
  if (state.climbIndex >= state.climbsPerTurn) {
    return "finished";
  }

  return state.climbs[state.climbIndex]?.status === "running" ? "running" : "ready";
};

/** What this turn has banked so far, against what the team held when it started. */
export const resolvePointsSoFar = (state: MountRuntimeState): number => {
  if (state.activeTurnTeamId === null) {
    return 0;
  }

  return Math.max(0, (state.pendingPointsByTeamId[state.activeTurnTeamId] ?? 0) - state.turnStartPoints);
};

// Nothing about a climb is secret — the whole pile is on the TV as it happens — so the host and
// display views are the same projection; the two exports exist so each outer union gets its own
// member.
const toMountViewFields = (state: MountRuntimeState): MountMinigameHostView => {
  const phase = resolveMountPhase(state);
  const pointsSoFar = resolvePointsSoFar(state);
  const base = {
    minigame: "MOUNT" as const,
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    climbIndex: state.climbIndex,
    climbsPerTurn: state.climbsPerTurn,
    rules: { climbSeconds: state.climbSeconds, secondsPerHen: state.secondsPerHen },
    pile: clonePile(state.pile),
    figures: Object.fromEntries(
      Object.entries(state.figures).map(([playerId, figure]) => [playerId, { ...figure }])
    ),
    climbs: state.climbs.map((climb) => ({
      ...climb,
      player: climb.player === null ? null : { ...climb.player },
      inputs: climb.inputs.map((sample) => ({ ...sample })),
      result: climb.result === null ? null : { ...climb.result }
    })),
    shareBanked: resolveShareBanked(state.climbs),
    pointsSoFar
  };

  return phase === "finished"
    ? { ...base, phase, points: pointsSoFar }
    : { ...base, phase, points: null };
};

export const toMountHostView = (state: MountRuntimeState): MountMinigameHostView => {
  return toMountViewFields(state);
};

export const toMountDisplayView = (state: MountRuntimeState): MountMinigameDisplayView => {
  return toMountViewFields(state);
};
