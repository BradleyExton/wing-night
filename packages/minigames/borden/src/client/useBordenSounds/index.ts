import { useEffect, useRef } from "react";
import { createHouseSoundboard, type HouseCueName, type HouseSoundboard } from "@wingnight/audio";
import type { BordenEvent, BordenEventKind, BordenOutcome } from "@wingnight/shared";

import type { BordenBase } from "../useBordenFrame/index.js";

// What each thing the sim does sounds like, off the house board: the base has no voice of its own
// yet, so it borrows the show's pops and stings, as the games without a table do.
const EVENT_CUES: Partial<Record<BordenEventKind, HouseCueName>> = {
  jump: "whoosh",
  fire: "tickOn",
  hit: "hit",
  "bottle-lost": "fizzle",
  down: "miss",
  revive: "arrive",
  ko: "pop",
  bottle: "chime",
  splash: "plop"
};

const OUTCOME_CUES: Record<BordenOutcome, HouseCueName> = { cleared: "fanfare", wipe: "timesUp", timeout: "gong" };

/** The buzz on this phone's own hit (Android; iOS has none): a short one for the bottle, a long one for a heart. */
const BUZZ_MS: Partial<Record<BordenEventKind, number>> = { "bottle-lost": 40, hit: 120, down: 300 };

/** The new events on a frame: those past the last tick this screen has sounded. */
export const resolveFreshEvents = (events: readonly BordenEvent[], heardThroughTick: number): BordenEvent[] =>
  events.filter((event) => event.tick > heardThroughTick);

type BordenSoundsInput = {
  base: BordenBase;
  /** Whether this screen is the room's speaker: every phone online, the TV at the party. */
  isSpeaker: boolean;
  /** This phone's own hen, for the buzz; null on a screen nobody holds. */
  ownSlot: number | null;
};

/**
 * The base's sounds, and this phone's buzz on its own hen's hits, rung once per event as the frame
 * this screen draws reaches it. A new stretch starts its count again; a frame stepped back to (the
 * room's, a hop behind the screen) rings nothing it already rang.
 */
export const useBordenSounds = ({ base, isSpeaker, ownSlot }: BordenSoundsInput): void => {
  const board = useRef<HouseSoundboard | null>(null);
  const ownSlotRef = useRef(ownSlot);

  ownSlotRef.current = ownSlot;

  useEffect(() => {
    if (!isSpeaker) {
      return undefined;
    }

    board.current ??= createHouseSoundboard();

    let key = base.key();
    let heardThroughTick = base.read()?.tick ?? 0;
    let heardOutcome = base.read()?.outcome ?? null;

    return base.subscribe(() => {
      const frame = base.read();

      if (frame === null) {
        return;
      }

      if (base.key() !== key) {
        key = base.key();
        heardThroughTick = frame.tick;
        heardOutcome = frame.outcome;

        return;
      }

      for (const event of resolveFreshEvents(frame.events, heardThroughTick)) {
        const cue = EVENT_CUES[event.kind];

        if (cue !== undefined) {
          board.current?.play(cue);
        }

        const buzz = BUZZ_MS[event.kind];

        if (buzz !== undefined && event.hen === ownSlotRef.current && typeof navigator.vibrate === "function") {
          navigator.vibrate(buzz);
        }
      }

      if (frame.outcome !== null && heardOutcome === null) {
        board.current?.play(OUTCOME_CUES[frame.outcome]);
      }

      heardThroughTick = Math.max(heardThroughTick, frame.tick);
      heardOutcome = frame.outcome;
    });
  }, [base, isSpeaker]);
};
