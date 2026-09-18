import type {
  JoustMinigameArena,
  JoustMinigameDisplayView,
  JoustMinigameHostView,
  JoustPrompt
} from "@wingnight/shared";

import { resolveActiveShooter } from "../lineup/index.js";
import type { JoustRuntimeContent, JoustRuntimeState } from "../types/index.js";

export const resolveCurrentArena = (
  state: JoustRuntimeState,
  content: JoustRuntimeContent
): JoustPrompt | null => {
  if (state.arenaId === null) {
    return null;
  }

  return content.prompts.find((prompt) => prompt.id === state.arenaId) ?? null;
};

const toViewArena = (prompt: JoustPrompt): JoustMinigameArena => {
  return {
    id: prompt.id,
    name: prompt.name,
    perches: prompt.perches.map((perch) => ({ ...perch })),
    obstacles: prompt.obstacles.map((obstacle) => ({ ...obstacle }))
  };
};

// Nothing in a joust is a secret, so the host and display views are the same
// projection; the two exports exist so each outer union gets its own member.
const toJoustViewFields = (state: JoustRuntimeState, content: JoustRuntimeContent) => {
  const arena = resolveCurrentArena(state, content);

  return {
    minigame: "JOUST" as const,
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    phase: state.phase,
    arena: arena === null ? null : toViewArena(arena),
    lineup: state.lineup.map((figure) => ({ ...figure })),
    teammates: state.teammates.map((figure) => ({ ...figure })),
    downPlayerIds: [...state.downPlayerIds],
    activeShooterPlayerId:
      state.phase === "done"
        ? null
        : (resolveActiveShooter(state.teammates, state.shotIndex)?.playerId ?? null),
    shotsPerTurn: state.shotsPerTurn,
    shotIndex: state.shotIndex,
    aim: { ...state.aim },
    shots: state.shots.map((shot) => ({
      ...shot,
      toppledPlayerIds: [...shot.toppledPlayerIds]
    })),
    lastShot:
      state.lastShot === null
        ? null
        : {
            ...state.lastShot,
            toppledPlayerIds: [...state.lastShot.toppledPlayerIds],
            pinPlayerIds: [...state.lastShot.pinPlayerIds],
            aim: { ...state.lastShot.aim },
            run: {
              ...state.lastShot.run,
              keyframes: state.lastShot.run.keyframes.map((frame) => [...frame]),
              topples: state.lastShot.run.topples.map((topple) => ({ ...topple }))
            }
          }
  };
};

export const toJoustHostView = (
  state: JoustRuntimeState,
  content: JoustRuntimeContent
): JoustMinigameHostView => {
  return toJoustViewFields(state, content);
};

export const toJoustDisplayView = (
  state: JoustRuntimeState,
  content: JoustRuntimeContent
): JoustMinigameDisplayView => {
  return toJoustViewFields(state, content);
};
