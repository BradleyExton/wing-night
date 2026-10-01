import { useEffect, useReducer, useRef, type RefObject } from "react";
import type { BrawlBlock, BrawlCourse, BrawlFrame, BrawlInput, BrawlMinigameBlock, BrawlOutcome } from "@wingnight/shared";
import { BRAWL_WORLD, advanceBrawl, createBrawlRunStart, runBrawlRun } from "@wingnight/shared";

import { CLEARED_BEAT_MS, HIT_PAUSE_MS, KO_BEAT_MS, TIMEOUT_BEAT_MS } from "../beats/index.js";
import type { BrawlSceneHandle } from "../BrawlScene/index.js";
import { paintGoonsTally } from "../goonsTally/index.js";
import { paintHearts } from "../hearts/index.js";
import { resolveMirrorEvents, type BrawlMirrorEvent } from "../mirrorEvents/index.js";
import { paintWaveMeter, resolveWaveMeter } from "../waveMeter/index.js";

/**
 * The wall's own announcements on top of the replay's: the start of each ending beat, so the
 * speaker rings the beat the room is watching — the handoff, the splash into the bay, the bell.
 */
export type BrawlBeatEvent = { kind: "handoff" } | { kind: "bay" } | { kind: "bell" };

export type BrawlDisplayEvent = BrawlMirrorEvent | BrawlBeatEvent;

export type BrawlDisplayEventHandler = (event: BrawlDisplayEvent) => void;

export type BrawlMirrorInput = {
  /** The block the wall is showing, as the view has it: whose, its status and its input log. */
  viewBlock: BrawlMinigameBlock | null;
  /** That block's street, laid out (`useBrawlBlock`). */
  block: BrawlBlock;
  /** What laid the block out, so the referee's own re-run lands on the same block. */
  course: BrawlCourse;
  sceneRef: RefObject<BrawlSceneHandle>;
  /** The marquee's hearts, its worth-down tally and the wave strip, written every frame. */
  heartsRef?: RefObject<HTMLElement>;
  tallyRef?: RefObject<HTMLElement>;
  waveMeterRef?: RefObject<HTMLElement>;
  /** What the turn banked before this block, and the whole course's worth (`goonsTally/`). */
  goonsBanked?: number;
  goonsTotal?: number;
  /** What the replay announces between frames, and each beat as it starts; STABLE identity, read from a ref. */
  onEvent?: BrawlDisplayEventHandler;
};

// How far behind the tablet the wall draws, in ticks: a tenth of a second, so a thumb has normally
// arrived before the mirror reaches the tick it applies to and the hen on the wall does not walk
// into a lunge she actually pecked.
export const MIRROR_DELAY_TICKS = 6;

type MirrorBlock = {
  key: string;
  inputs: readonly BrawlInput[];
  frame: BrawlFrame;
  startedAtMs: number | null;
  rafHandle: number;
};

type MirrorBeat = {
  rafHandle: number;
  then: (() => void) | null;
};

const BEAT_DURATION_MS: Record<BrawlOutcome, number> = {
  cleared: CLEARED_BEAT_MS,
  ko: KO_BEAT_MS,
  timeout: TIMEOUT_BEAT_MS
};

const BEAT_EVENT: Record<BrawlOutcome, BrawlBeatEvent> = {
  cleared: { kind: "handoff" },
  ko: { kind: "bay" },
  timeout: { kind: "bell" }
};

const prefersReducedMotion = (): boolean => {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/** Whether `next` only adds to `previous` at or after `fromTick` — a log the mirror can carry on with. */
export const isLogAppendedFrom = (previous: readonly BrawlInput[], next: readonly BrawlInput[], fromTick: number): boolean => {
  if (next.length < previous.length) {
    return false;
  }

  for (let index = 0; index < next.length; index += 1) {
    const entry = next[index];
    const was = previous[index];

    if (entry === undefined) {
      return false;
    }

    if (was === undefined) {
      if (entry.tick < fromTick) {
        return false;
      }

      continue;
    }

    if (was.tick !== entry.tick || was.kind !== entry.kind || (was.kind === "walk" && entry.kind === "walk" && was.dir !== entry.dir)) {
      return false;
    }
  }

  return true;
};

const resolveInputLogKey = (inputs: readonly BrawlInput[]): string => {
  return inputs.map((input) => (input.kind === "walk" ? `${input.tick}w${input.dir}` : `${input.tick}p`)).join(",");
};

/**
 * The display re-runs the tablet's block from its input log (`useSchlonicMirror`'s twin) on a
 * local clock that starts when the first thumb arrives, `MIRROR_DELAY_TICKS` behind. A thumb
 * that arrives for a tick the mirror has already drawn re-simulates from the top — a few thousand
 * trivial steps — so the picture is always the log's truth, never a guess. No clock is
 * synchronised with anything. When the tablet moves on while the wall is still mid-block, the wall
 * finishes the block it has, plays how it ended, and only then draws what the tablet is on.
 */
export const useBrawlMirror = ({
  viewBlock,
  block,
  course,
  sceneRef,
  heartsRef,
  tallyRef,
  waveMeterRef,
  goonsBanked = 0,
  goonsTotal = 0,
  onEvent
}: BrawlMirrorInput): void => {
  const mirrorRef = useRef<MirrorBlock | null>(null);
  const beatRef = useRef<MirrorBeat | null>(null);
  // The listener and the tally's range are refs: the loop's closure must see the current ones
  // without the effect being torn down mid-block.
  const onEventRef = useRef(onEvent);
  const tallyRangeRef = useRef({ banked: goonsBanked, total: goonsTotal });
  // Set once the block in hand has ended with the tablet already elsewhere: the effect below runs
  // again against whatever the tablet is on by then.
  const pendingRef = useRef<(() => void) | null>(null);
  const [settledCount, markSettled] = useReducer((count: number) => count + 1, 0);

  onEventRef.current = onEvent;
  tallyRangeRef.current = { banked: goonsBanked, total: goonsTotal };

  const blockIndex = viewBlock?.blockIndex ?? null;
  const blockStatus = viewBlock?.status ?? null;
  const isSkipped = viewBlock?.skipped ?? false;
  const inputs = viewBlock?.inputs ?? [];
  const inputLogKey = resolveInputLogKey(inputs);

  // The chrome the loop writes outside the scene: the hearts, the worth down and the wave strip.
  const paintChrome = (frame: BrawlFrame, shownBlock: BrawlBlock): void => {
    paintHearts(heartsRef?.current ?? null, frame.hearts);
    paintGoonsTally(tallyRef?.current ?? null, tallyRangeRef.current.banked + frame.goonsDown, tallyRangeRef.current.total);
    paintWaveMeter(waveMeterRef?.current ?? null, resolveWaveMeter(frame, shownBlock));
  };

  // The loops live on refs and are stopped on purpose — when a new block or a still frame replaces
  // them, or on unmount — never by an effect's cleanup, so a block the tablet has already moved
  // past can still play out.
  const stopLoop = (): void => {
    const mirror = mirrorRef.current;

    if (mirror !== null && mirror.rafHandle !== 0) {
      window.cancelAnimationFrame(mirror.rafHandle);
      mirror.rafHandle = 0;
    }
  };

  const stopBeat = (): void => {
    const beat = beatRef.current;

    if (beat !== null && beat.rafHandle !== 0) {
      window.cancelAnimationFrame(beat.rafHandle);
    }

    beatRef.current = null;
  };

  const startBeat = (frame: BrawlFrame, outcome: BrawlOutcome, shownBlock: BrawlBlock): MirrorBeat => {
    stopBeat();

    const startedAtMs = performance.now();
    const beat: MirrorBeat = { rafHandle: 0, then: null };
    const paintBeat = (progress: number): void => {
      const scene = sceneRef.current;

      if (outcome === "cleared") {
        scene?.paintCleared(frame, progress);
      } else if (outcome === "ko") {
        scene?.paintKo(frame, progress);
      } else {
        scene?.paintTimeout(frame, progress);
      }

      paintChrome(frame, shownBlock);
    };
    const step = (now: number): void => {
      const progress = (now - startedAtMs) / BEAT_DURATION_MS[outcome];

      paintBeat(Math.min(1, progress));

      if (progress >= 1) {
        beat.rafHandle = 0;
        beatRef.current = null;
        beat.then?.();
        return;
      }

      beat.rafHandle = window.requestAnimationFrame(step);
    };

    beatRef.current = beat;
    onEventRef.current?.(BEAT_EVENT[outcome]);
    paintBeat(0);
    beat.rafHandle = window.requestAnimationFrame(step);

    return beat;
  };

  const settleBlock = (mirror: MirrorBlock, shownBlock: BrawlBlock): void => {
    mirror.rafHandle = 0;

    const beat = startBeat(mirror.frame, mirror.frame.outcome ?? "timeout", shownBlock);

    beat.then = (): void => {
      const pending = pendingRef.current;

      pendingRef.current = null;
      pending?.();
    };
  };

  const paintStill = (key: string, frame: BrawlFrame, shownBlock: BrawlBlock): void => {
    stopLoop();
    stopBeat();
    mirrorRef.current = { key, inputs: [], frame, startedAtMs: null, rafHandle: 0 };
    sceneRef.current?.paint(frame);
    paintChrome(frame, shownBlock);
  };

  useEffect(() => {
    const shownBlock = block;

    if (viewBlock === null || blockIndex === null || blockStatus === null) {
      pendingRef.current = null;
      paintStill("", createBrawlRunStart(shownBlock), shownBlock);
      return;
    }

    const key = `${blockIndex}`;
    const current = mirrorRef.current;

    // The tablet is on a different block than the wall. If the wall is still fighting the old one,
    // let it end first; if it is playing that out, queue the switch behind the beat.
    if (current !== null && current.key !== key && current.key !== "") {
      const isStillRunning = current.startedAtMs !== null && current.frame.outcome === null;

      if (isStillRunning || beatRef.current !== null) {
        pendingRef.current = (): void => {
          mirrorRef.current = null;
          markSettled();
        };
        return;
      }
    }

    pendingRef.current = null;

    if (blockStatus === "ready" || (blockStatus === "done" && isSkipped)) {
      paintStill(key, createBrawlRunStart(shownBlock), shownBlock);
      return;
    }

    // The fight is the game, not decoration — but a viewer who asked for less motion still gets
    // how it ended, just without the fighting. A wall that missed the block (a reload) gets the
    // referee's own reading of it, and its ending.
    if (
      blockStatus === "done" &&
      (prefersReducedMotion() || current === null || current.key !== key || current.startedAtMs === null)
    ) {
      const settled = runBrawlRun(course, inputs).frame;

      paintStill(key, settled, shownBlock);

      if (!prefersReducedMotion()) {
        startBeat(settled, settled.outcome ?? "timeout", shownBlock);
      }

      return;
    }

    // A beat is already playing this block out; nothing new to draw.
    if (beatRef.current !== null && current !== null && current.key === key) {
      return;
    }

    const mirror: MirrorBlock =
      current !== null && current.key === key
        ? current
        : { key, inputs: [], frame: createBrawlRunStart(shownBlock), startedAtMs: null, rafHandle: 0 };

    stopLoop();
    mirrorRef.current = mirror;
    mirror.startedAtMs ??= performance.now();

    const resolveTargetTick = (now: number): number => {
      return Math.max(
        0,
        Math.floor(((now - (mirror.startedAtMs ?? now)) * BRAWL_WORLD.tickHz) / 1000) - MIRROR_DELAY_TICKS
      );
    };

    // The log changed under a running mirror. A thumb for a tick it has not drawn yet just joins
    // the log; one for a tick it already drew rebuilds the frame from the top with the log as it
    // now is, up to where the clock says we are.
    if (!isLogAppendedFrom(mirror.inputs, inputs, mirror.frame.tick)) {
      mirror.frame = advanceBrawl(
        createBrawlRunStart(shownBlock),
        shownBlock,
        inputs,
        Math.max(mirror.frame.tick, resolveTargetTick(performance.now()))
      );
    }

    mirror.inputs = inputs;

    if (mirror.frame.outcome !== null) {
      settleBlock(mirror, shownBlock);
      return;
    }

    sceneRef.current?.paint(mirror.frame);
    paintChrome(mirror.frame, shownBlock);

    const step = (now: number): void => {
      const previous = mirror.frame;

      mirror.frame = advanceBrawl(mirror.frame, shownBlock, mirror.inputs, resolveTargetTick(now));

      for (const event of resolveMirrorEvents(previous, mirror.frame, shownBlock)) {
        onEventRef.current?.(event);
      }

      // A hit stops the wall's clock for a beat and jolts the picture, the same pause the tablet
      // takes, so the two stay a fixed few ticks apart.
      if (mirror.frame.hits.length > previous.hits.length) {
        mirror.startedAtMs = (mirror.startedAtMs ?? now) + HIT_PAUSE_MS;
        sceneRef.current?.shake();
      }

      if (mirror.frame.outcome !== null) {
        settleBlock(mirror, shownBlock);
        return;
      }

      sceneRef.current?.paint(mirror.frame);
      paintChrome(mirror.frame, shownBlock);
      mirror.rafHandle = window.requestAnimationFrame(step);
    };

    mirror.rafHandle = window.requestAnimationFrame(step);
    // The dependencies are narrowed by hand: the loop must not be torn down by a fresh copy of the
    // same view (every echo is one), only by the block, its status or its log changing.
  }, [blockIndex, blockStatus, isSkipped, inputLogKey, block, sceneRef, heartsRef, tallyRef, waveMeterRef, settledCount]);

  useEffect(() => {
    return (): void => {
      stopLoop();
      stopBeat();
    };
  }, []);
};
