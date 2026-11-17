import { useEffect, useRef } from "react";
import type { MinigameRuntimePlugin, MinigameRuntimeSelectorInput, SerializableValue } from "@wingnight/minigames-core";

// Fired this long after the deadline, never before it, as the server's own scheduler does
// (`MINIGAME_DEADLINE_GRACE_MS`): a timer may wake a millisecond early, and a game refuses a
// deadline action that is early.
const DEADLINE_GRACE_MS = 25;

/**
 * The server's clock, for a page that is its own server: the dev sandbox and the teaser run a
 * game's reducer in the browser, and a game that asks the server to send an action on its own
 * clock (`MinigameRuntimePlugin.selectDeadlineAction` — FAPPY's relay limit, Streets of Barrie's
 * pulse) would otherwise wait for ever. Read after every state change, like the real scheduler:
 * a deadline that moved is rescheduled, one that went away is dropped.
 */
export const useRuntimeDeadline = (
  runtimePlugin: MinigameRuntimePlugin,
  selectorInput: MinigameRuntimeSelectorInput,
  dispatch: (actionType: string, actionPayload: SerializableValue) => void
): void => {
  const deadline = runtimePlugin.selectDeadlineAction?.(selectorInput) ?? null;
  const actionType = deadline?.actionType ?? null;
  const atMs = deadline?.atMs ?? null;
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    dispatchRef.current = dispatch;
  });

  useEffect(() => {
    if (actionType === null || atMs === null) {
      return undefined;
    }

    const handle = window.setTimeout(
      () => {
        dispatchRef.current(actionType, {});
      },
      Math.max(0, atMs - Date.now()) + DEADLINE_GRACE_MS
    );

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [actionType, atMs]);
};
