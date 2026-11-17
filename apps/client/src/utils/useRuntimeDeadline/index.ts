import { useEffect, useRef } from "react";
import type { MinigameDeadlineAction, SerializableValue } from "@wingnight/minigames-core";

// Fired this long after the deadline, never before it, as the server's own scheduler does: a
// timer may wake a hair early by the wall clock, and a game may refuse a deadline action that is.
export const RUNTIME_DEADLINE_GRACE_MS = 25;

/** How long from `nowMs` until a deadline at `atMs` is due, grace included; never negative. */
export const resolveDeadlineDelayMs = (atMs: number, nowMs: number): number => {
  return Math.max(0, atMs - nowMs) + RUNTIME_DEADLINE_GRACE_MS;
};

/**
 * The server's deadline clock (`MinigameRuntimePlugin.selectDeadlineAction`) for a page that IS
 * the server — the dev sandbox and the teaser, which reduce the runtime in the page. Without it a
 * game that paces itself on the server's clock (JOUST calling the next shooter) would sit still
 * there. Keyed on the deadline's action and time, so the ordinary re-renders of a live turn never
 * restart it; a deadline that moves or goes away cancels the one pending.
 */
export const useRuntimeDeadline = (
  deadline: MinigameDeadlineAction | null,
  onDispatchAction: (actionType: string, actionPayload: SerializableValue) => void
): void => {
  const dispatchRef = useRef(onDispatchAction);
  const actionType = deadline?.actionType ?? null;
  const atMs = deadline?.atMs ?? null;

  dispatchRef.current = onDispatchAction;

  useEffect(() => {
    if (actionType === null || atMs === null) {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      dispatchRef.current(actionType, {});
    }, resolveDeadlineDelayMs(atMs, Date.now()));

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [actionType, atMs]);
};
