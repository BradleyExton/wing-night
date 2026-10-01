import { useEffect, useRef } from "react";

import type { BlockHold } from "../useHeldBlock/index.js";
import type { BrawlBeatEvent, BrawlDisplayEventHandler } from "../useBrawlMirror/index.js";

/** The beat a hold opens on, as the sound it starts with; a skipped block has no beat to sound. */
export const resolveHoldBeatEvent = (hold: BlockHold | null): BrawlBeatEvent | null => {
  if (hold === null || hold.outcome === "skipped") {
    return null;
  }

  return hold.outcome === "cleared" ? { kind: "handoff" } : hold.outcome === "ko" ? { kind: "bay" } : { kind: "bell" };
};

/**
 * The beat cues a surface that is its own speaker sounds as each hold opens: the handoff
 * flourish, the splash, the bell. On the night the TV's mirror fires these as it starts each
 * beat; a solo tablet has no mirror, only the hold, so it rings them off that — once per hold,
 * however often the surface renders under it.
 */
export const useSoloBeatSounds = (
  hold: BlockHold | null,
  onEvent: BrawlDisplayEventHandler | undefined
): void => {
  const soundedRef = useRef<string | null>(null);
  const onEventRef = useRef(onEvent);

  onEventRef.current = onEvent;

  const key = hold === null ? null : `${hold.blockIndex}:${hold.outcome}:${hold.startedAtMs}`;

  useEffect(() => {
    const event = resolveHoldBeatEvent(hold);

    if (key === null || event === null || soundedRef.current === key) {
      return;
    }

    soundedRef.current = key;
    onEventRef.current?.(event);
  }, [key, hold]);
};
