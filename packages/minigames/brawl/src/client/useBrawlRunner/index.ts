import { useEffect, useRef, type RefObject } from "react";
import type { BrawlBlock, BrawlFrame, BrawlInput, BrawlMinigameBlock, BrawlOutcome } from "@wingnight/shared";
import { BRAWL_WORLD, advanceBrawl, createBrawlRunStart } from "@wingnight/shared";

import { CLEARED_BEAT_MS, HIT_PAUSE_MS, KO_BEAT_MS, TIMEOUT_BEAT_MS } from "../beats/index.js";
import type { BrawlSceneHandle } from "../BrawlScene/index.js";
import { paintGoonsTally } from "../goonsTally/index.js";
import { paintHearts } from "../hearts/index.js";
import { resolveMirrorEvents, type BrawlMirrorEventHandler } from "../mirrorEvents/index.js";

export type BrawlWalkDir = -1 | 0 | 1;

export type BrawlRunnerInput = {
  /** The block the surface is showing, as the view has it: whose, and whether it is ready, running or done. */
  viewBlock: BrawlMinigameBlock | null;
  /** That block's street, laid out (`useBrawlBlock`). */
  block: BrawlBlock;
  canAct: boolean;
  sceneRef: RefObject<BrawlSceneHandle>;
  /** Where the hearts are written each frame: the chrome's glyphs, outside the scene. */
  heartsRef?: RefObject<HTMLElement>;
  /**
   * Where the worth down is written each frame, and what it is written over: what the turn banked
   * before this block, and the whole course's worth (`goonsTally/`).
   */
  tallyRef?: RefObject<HTMLElement>;
  goonsBanked?: number;
  goonsTotal?: number;
  onWalk: (tick: number, dir: BrawlWalkDir) => void;
  onPeck: (tick: number) => void;
  onEndBlock: () => void;
  /**
   * What the block announces as it plays — the same events the TV's mirror reads off its replay.
   * Only a tablet that is its own speaker (a solo surface) listens; on the night the TV makes the
   * noise and the tablet stays quiet.
   */
  onEvent?: BrawlMirrorEventHandler;
};

type LocalRun = {
  frame: BrawlFrame;
  inputs: BrawlInput[];
  startedAtMs: number | null;
  rafHandle: number;
  hasEnded: boolean;
  /** The thumb as the log last has it, so a slide that stays on one side logs nothing. */
  walkDir: BrawlWalkDir;
};

// A beat playing over the block's terminal frame, `progress` 0 → 1. `then` runs when it is over —
// the next block the server has already moved to, held back until the room has seen this one end.
type LocalBeat = {
  outcome: BrawlOutcome;
  frame: BrawlFrame;
  startedAtMs: number;
  rafHandle: number;
  then: (() => void) | null;
};

const BEAT_DURATION_MS: Record<BrawlOutcome, number> = {
  cleared: CLEARED_BEAT_MS,
  ko: KO_BEAT_MS,
  timeout: TIMEOUT_BEAT_MS
};

/**
 * The tablet fights the block itself (`useSchlonicRunner`'s twin): a fixed-step sim on the local
 * clock, painted every animation frame, with each thumb logged at the tick it landed on and sent
 * to the server as one action. The server's echo of the log never drives this loop — the local
 * copy does — so the hen answers the thumb with zero round trips. The clock starts on the first
 * touch of either thumb. When the local sim reaches an outcome the block is reported ended; the
 * server re-runs the same log and takes its own reading, which is the only one that scores. The
 * ending then plays as a beat before the next block is drawn.
 */
export const useBrawlRunner = ({
  viewBlock,
  block,
  canAct,
  sceneRef,
  heartsRef,
  tallyRef,
  goonsBanked = 0,
  goonsTotal = 0,
  onWalk,
  onPeck,
  onEndBlock,
  onEvent
}: BrawlRunnerInput): { walk: (dir: BrawlWalkDir) => void; peck: () => void } => {
  const blockIndex = viewBlock?.blockIndex ?? null;
  const blockStatus = viewBlock?.status ?? null;
  const blockRef = useRef(block);
  const createLocalRun = (): LocalRun => ({
    frame: createBrawlRunStart(blockRef.current),
    inputs: [],
    startedAtMs: null,
    rafHandle: 0,
    hasEnded: false,
    walkDir: 0
  });
  const runRef = useRef<LocalRun | null>(null);
  const beatRef = useRef<LocalBeat | null>(null);
  const callbacksRef = useRef({ onWalk, onPeck, onEndBlock, onEvent });
  const viewBlockRef = useRef(viewBlock);
  const canActRef = useRef(canAct);
  const tallyRangeRef = useRef({ banked: goonsBanked, total: goonsTotal });

  blockRef.current = block;
  tallyRangeRef.current = { banked: goonsBanked, total: goonsTotal };
  callbacksRef.current = { onWalk, onPeck, onEndBlock, onEvent };
  viewBlockRef.current = viewBlock;
  canActRef.current = canAct;

  if (runRef.current === null) {
    runRef.current = createLocalRun();
  }

  const stopLoop = (): void => {
    const local = runRef.current;

    if (local !== null && local.rafHandle !== 0) {
      window.cancelAnimationFrame(local.rafHandle);
      local.rafHandle = 0;
    }
  };

  const stopBeat = (): void => {
    const beat = beatRef.current;

    if (beat !== null && beat.rafHandle !== 0) {
      window.cancelAnimationFrame(beat.rafHandle);
    }

    beatRef.current = null;
  };

  // The chrome the loop owns: the hearts left and the worth down, off the frame it just drew.
  const paintChrome = (frame: BrawlFrame): void => {
    paintHearts(heartsRef?.current ?? null, frame.hearts);
    paintGoonsTally(
      tallyRef?.current ?? null,
      tallyRangeRef.current.banked + frame.goonsDown,
      tallyRangeRef.current.total
    );
  };

  const paintBeat = (beat: LocalBeat, progress: number): void => {
    const scene = sceneRef.current;

    if (beat.outcome === "cleared") {
      scene?.paintCleared(beat.frame, progress);
    } else if (beat.outcome === "ko") {
      scene?.paintKo(beat.frame, progress);
    } else {
      scene?.paintTimeout(beat.frame, progress);
    }

    paintChrome(beat.frame);
  };

  const startBeat = (frame: BrawlFrame, outcome: BrawlOutcome): void => {
    stopBeat();

    const beat: LocalBeat = { outcome, frame, startedAtMs: performance.now(), rafHandle: 0, then: null };
    const step = (now: number): void => {
      const progress = (now - beat.startedAtMs) / BEAT_DURATION_MS[outcome];

      paintBeat(beat, Math.min(1, progress));

      if (progress >= 1) {
        beat.rafHandle = 0;
        beatRef.current = null;
        beat.then?.();
        return;
      }

      beat.rafHandle = window.requestAnimationFrame(step);
    };

    beatRef.current = beat;
    paintBeat(beat, 0);
    beat.rafHandle = window.requestAnimationFrame(step);
  };

  const step = (now: number): void => {
    const local = runRef.current;

    if (local === null || local.startedAtMs === null) {
      return;
    }

    const targetTick = Math.floor(((now - local.startedAtMs) * BRAWL_WORLD.tickHz) / 1000);
    const previous = local.frame;

    local.frame = advanceBrawl(local.frame, blockRef.current, local.inputs, targetTick);

    // Nobody listening is the party tablet, every frame of the night: it skips the diffing.
    const listener = callbacksRef.current.onEvent;

    if (listener !== undefined) {
      for (const event of resolveMirrorEvents(previous, local.frame, blockRef.current)) {
        listener(event);
      }
    }

    // A hit stops the clock for a beat and jolts the picture. The clock, not the sim.
    if (local.frame.hits.length > previous.hits.length) {
      local.startedAtMs += HIT_PAUSE_MS;
      sceneRef.current?.shake();
    }

    if (local.frame.outcome !== null) {
      local.rafHandle = 0;
      startBeat(local.frame, local.frame.outcome);

      if (!local.hasEnded) {
        local.hasEnded = true;
        callbacksRef.current.onEndBlock();
      }

      return;
    }

    sceneRef.current?.paint(local.frame);
    paintChrome(local.frame);
    local.rafHandle = window.requestAnimationFrame(step);
  };

  // Follow the block the server says we are on. A `ready` block starts a fresh local run on the
  // line — after the previous one's beat, if one is still playing. A `running` one with no local
  // run is a tablet that mounted mid-block (a reload): hand the server what it has rather than
  // pretend to resume a block nobody is fighting. A block that went `done` under a live local run
  // was skipped by the host: the loop stops where it is.
  useEffect(() => {
    if (blockIndex === null || blockStatus === null) {
      stopLoop();
      stopBeat();
      runRef.current = createLocalRun();
      return;
    }

    if (blockStatus === "ready") {
      const restart = (): void => {
        stopLoop();
        runRef.current = createLocalRun();
        sceneRef.current?.paint(runRef.current.frame);
        paintChrome(runRef.current.frame);
      };

      if (beatRef.current !== null) {
        beatRef.current.then = restart;
        return;
      }

      restart();
      return;
    }

    const local = runRef.current;

    if (local === null || local.hasEnded) {
      return;
    }

    if (blockStatus === "running" && local.startedAtMs === null) {
      local.hasEnded = true;
      callbacksRef.current.onEndBlock();
    } else if (blockStatus === "done") {
      local.hasEnded = true;
      stopLoop();
    }
  }, [blockIndex, blockStatus, sceneRef, heartsRef, tallyRef]);

  useEffect(() => {
    return (): void => {
      stopLoop();
      stopBeat();
    };
  }, []);

  const isArmed = (local: LocalRun): boolean => {
    return (
      canActRef.current &&
      viewBlockRef.current !== null &&
      viewBlockRef.current.status !== "done" &&
      !local.hasEnded &&
      local.frame.outcome === null &&
      beatRef.current === null
    );
  };

  // The first touch of either thumb starts the clock on the line; every touch after is logged at
  // the frame's tick. The log is non-decreasing — a walk and a peck may share a tick.
  const log = (input: { kind: "walk"; dir: BrawlWalkDir } | { kind: "peck" }): void => {
    const local = runRef.current;

    if (local === null || !isArmed(local)) {
      return;
    }

    if (local.startedAtMs === null) {
      if (input.kind === "walk" && input.dir === 0) {
        return;
      }

      local.startedAtMs = performance.now();
      local.frame = createBrawlRunStart(blockRef.current);
      local.inputs = [];
    }

    const lastTick = local.inputs[local.inputs.length - 1]?.tick ?? 0;
    const tick = Math.max(local.frame.tick, lastTick);

    if (input.kind === "walk") {
      local.walkDir = input.dir;
      local.inputs.push({ tick, kind: "walk", dir: input.dir });
      callbacksRef.current.onWalk(tick, input.dir);
    } else {
      local.inputs.push({ tick, kind: "peck" });
      callbacksRef.current.onPeck(tick);
    }

    if (local.rafHandle === 0) {
      local.rafHandle = window.requestAnimationFrame(step);
    }
  };

  const walk = (dir: BrawlWalkDir): void => {
    if (runRef.current?.walkDir === dir) {
      return;
    }

    log({ kind: "walk", dir });
  };

  const peck = (): void => {
    log({ kind: "peck" });
  };

  return { walk, peck };
};
