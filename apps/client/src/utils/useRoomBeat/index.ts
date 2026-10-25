import { useEffect, useRef, useState, type RefObject } from "react";

import { DEFAULT_BAR_MS, resolveBarMs } from "../resolveCastMoves";

// The room's beats, counted, for a surface that schedules something on them
// (the cast's Moves, `resolveCastMoves`). It does not listen to the music
// itself: the display's one beat clock (`useBeatClock`) flips `data-beat` on
// its `group/beat` root on every kick, and this watches that attribute — the
// AudioContext is built once per element and never touched again, so a second
// listener must not tap the element. With no beat root above it (a still
// capture), it keeps the lobby's own 120 bpm.
//
// It renders only when the count crosses a step (`beatsPerStep` beats: a bar
// for the parade, a beat for the lineup's wave) and never past `stepLimit`, so
// a floor of birds is not re-rendered on every kick. The bar it measures goes
// on `anchorRef` as `--cast-move-ms`, which times a Move to the room's tempo.
export type RoomBeat = {
  // Steps since `active` went true (or `resetKey` changed), from 0 on the first
  // beat; null while inactive, before that first beat, or when the room asked
  // for less motion.
  step: number | null;
  // When this step began, in ms since the count did.
  stepAtMs: number;
  // The bar as the room plays it now.
  barMs: number;
  // The bar as it stood when the count began. The tempo is remembered between
  // counts, so this is the room's, and it holds still for the whole count: a
  // schedule laid out on it does not reshuffle as the estimate wobbles.
  openingBarMs: number;
};

type UseRoomBeatOptions = {
  active: boolean;
  resetKey: string | number;
  beatsPerStep: number;
  stepLimit?: number;
};

const BEAT_ROOT_SELECTOR = ".group\\/beat";
const FALLBACK_BEAT_MS = DEFAULT_BAR_MS / 4;
const INTERVAL_HISTORY = 8;

const INACTIVE: RoomBeat = { step: null, stepAtMs: 0, barMs: DEFAULT_BAR_MS, openingBarMs: DEFAULT_BAR_MS };

export const useRoomBeat = (
  anchorRef: RefObject<HTMLElement | null>,
  { active, resetKey, beatsPerStep, stepLimit = Number.POSITIVE_INFINITY }: UseRoomBeatOptions
): RoomBeat => {
  const [roomBeat, setRoomBeat] = useState<RoomBeat>(INACTIVE);
  // The gaps between the room's last few beats, kept across counts.
  const intervalsRef = useRef<number[]>([]);

  useEffect(() => {
    const anchor = anchorRef.current;

    setRoomBeat(INACTIVE);

    if (!active || anchor === null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const intervals = intervalsRef.current;
    const startedAtMs = performance.now();
    const openingBarMs = resolveBarMs(intervals);
    let beats = 0;
    let lastBeatAtMs: number | null = null;
    let lastStep: number | null = null;
    let barMs = openingBarMs;

    const onBeat = (): void => {
      const nowMs = performance.now();

      if (lastBeatAtMs !== null) {
        intervals.push(nowMs - lastBeatAtMs);
        if (intervals.length > INTERVAL_HISTORY) {
          intervals.shift();
        }
      }

      lastBeatAtMs = nowMs;
      beats += 1;

      const nextBarMs = resolveBarMs(intervals);

      if (Math.abs(nextBarMs - barMs) >= 50) {
        barMs = nextBarMs;
        anchor.style.setProperty("--cast-move-ms", `${barMs}ms`);
      }

      const step = Math.min(Math.floor((beats - 1) / beatsPerStep), stepLimit);

      if (step !== lastStep) {
        lastStep = step;
        setRoomBeat({ step, stepAtMs: nowMs - startedAtMs, barMs, openingBarMs });
      }
    };

    anchor.style.setProperty("--cast-move-ms", `${barMs}ms`);

    const root = anchor.closest(BEAT_ROOT_SELECTOR);

    if (root === null) {
      const metronome = window.setInterval(onBeat, FALLBACK_BEAT_MS);

      return () => {
        window.clearInterval(metronome);
      };
    }

    const observer = new MutationObserver(onBeat);

    observer.observe(root, { attributes: true, attributeFilter: ["data-beat"] });

    return () => {
      observer.disconnect();
    };
  }, [active, anchorRef, beatsPerStep, resetKey, stepLimit]);

  return roomBeat;
};
