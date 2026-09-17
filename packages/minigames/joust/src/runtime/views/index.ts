import type {
  JoustMinigameArena,
  JoustMinigameDisplayView,
  JoustMinigameHostView,
  JoustPrompt
} from "@wingnight/shared";

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
    targetX: prompt.targetX,
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
    shotsPerTurn: state.shotsPerTurn,
    shotIndex: state.shotIndex,
    aim: { ...state.aim },
    shots: state.shots.map((shot) => ({ ...shot })),
    lastShot:
      state.lastShot === null
        ? null
        : {
            ...state.lastShot,
            aim: { ...state.lastShot.aim },
            run: {
              ...state.lastShot.run,
              keyframes: state.lastShot.run.keyframes.map((frame) => [...frame])
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
