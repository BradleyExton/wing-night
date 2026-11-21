import type {
  BordenHenStats,
  BordenMinigameDisplayView,
  BordenMinigameHostView,
  BordenMinigameStretch,
  BordenPhase
} from "@wingnight/shared";

import { resolveBordenBanked, resolveBordenTotal } from "../scoring/index.js";
import type { BordenRuntimeState, BordenRuntimeStretch } from "../types/index.js";

// Derived, never stored: the game is over once every stretch is behind it; otherwise the room is in
// whatever state the stretch in hand is.
export const resolveBordenPhase = (state: BordenRuntimeState): BordenPhase => {
  if (state.stretchIndex >= state.stretchesPerTurn) {
    return "finished";
  }

  return state.stretches[state.stretchIndex]?.status === "running" ? "running" : "ready";
};

const resolvePoints = (state: BordenRuntimeState): number | null => {
  if (state.activeTurnTeamId === null || resolveBordenPhase(state) !== "finished") {
    return null;
  }

  return Math.max(0, (state.pendingPointsByTeamId[state.activeTurnTeamId] ?? 0) - state.turnStartPoints);
};

/**
 * What each player did over the game, by player id, once it is over: every stretch she ran, summed.
 * A hen with nobody behind her (the house hen) is on no card.
 */
export const resolveBordenTurnStats = (state: BordenRuntimeState): Record<string, BordenHenStats> | null => {
  if (resolveBordenPhase(state) !== "finished") {
    return null;
  }

  const stats: Record<string, BordenHenStats> = {};

  for (const stretch of state.stretches) {
    stretch.pair.forEach((seat, slot) => {
      const playerId = state.crew[seat]?.player?.playerId ?? null;
      const own = stretch.stats?.[slot];

      if (playerId === null || own === undefined) {
        return;
      }

      const sum = stats[playerId] ?? { downed: 0, worth: 0, dodged: 0, hits: 0, downs: 0, revives: 0 };

      stats[playerId] = {
        downed: sum.downed + own.downed,
        worth: sum.worth + own.worth,
        dodged: sum.dodged + own.dodged,
        hits: sum.hits + own.hits,
        downs: sum.downs + own.downs,
        revives: sum.revives + own.revives
      };
    });
  }

  return stats;
};

// The stretch as the room sees it. The frame goes out only for the stretch in hand and the one just
// finished (its last frame is what the handoff beat is drawn over). It is not copied: the sim never
// writes to a frame it was handed, and copying a few kilobytes into every view on every thumb is
// exactly what the room is trying not to pay.
const toViewStretch = (stretch: BordenRuntimeStretch, stretchIndex: number): BordenMinigameStretch => {
  const isDrawn = stretch.stretchIndex === stretchIndex || stretch.stretchIndex === stretchIndex - 1;

  return {
    stretchIndex: stretch.stretchIndex,
    status: stretch.status,
    pair: [...stretch.pair],
    bottles: [...stretch.bottles],
    startedAtMs: stretch.startedAtMs,
    readyAtMs: stretch.readyAtMs,
    frame: isDrawn ? stretch.frame : null,
    outcome: stretch.outcome,
    banked: stretch.banked,
    total: stretch.total,
    skipped: stretch.skipped
  };
};

// Nothing on the base is a secret, so the host and display views are the same projection; the two
// exports exist so each outer union gets its own member.
const toBordenViewFields = (state: BordenRuntimeState) => {
  return {
    minigame: "BORDEN" as const,
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    phase: resolveBordenPhase(state),
    stretchIndex: state.stretchIndex,
    stretchesPerTurn: state.stretchesPerTurn,
    courseSeed: state.courseSeed,
    roster: state.roster.map((figure) => ({ ...figure })),
    crew: state.crew.map((member) => ({ seat: member.seat, player: member.player === null ? null : { ...member.player } })),
    tablet: state.tablet,
    stretches: state.stretches.map((stretch) => toViewStretch(stretch, state.stretchIndex)),
    banked: resolveBordenBanked(state.stretches),
    total: resolveBordenTotal(state.stretches),
    points: resolvePoints(state),
    turnStats: resolveBordenTurnStats(state)
  };
};

export const toBordenHostView = (state: BordenRuntimeState): BordenMinigameHostView => {
  return toBordenViewFields(state);
};

export const toBordenDisplayView = (state: BordenRuntimeState): BordenMinigameDisplayView => {
  return toBordenViewFields(state);
};
