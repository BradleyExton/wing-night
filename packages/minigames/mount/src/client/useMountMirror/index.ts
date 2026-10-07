import { useEffect, useReducer, useRef, useState, type RefObject } from "react";
import {
  MOUNT_WORLD,
  advanceMount,
  createMountState,
  type MountClimbRules,
  type MountInputSample,
  type MountMinigameClimb,
  type MountOutcome,
  type MountPile,
  type MountState
} from "@wingnight/shared";

import { MOUNT_BEAT_MS, STUCK_BEAT_MS } from "../beats/index.js";
import { paintClimbClock } from "../climbClock/index.js";
import { resolveMirrorEvents, type MountDisplayEventHandler } from "../mirrorEvents/index.js";
import type { MountSceneHandle } from "../MountScene/index.js";
import { resolvePileKey } from "../MountScene/pileKey/index.js";

export type MountMirrorInput = {
  /** The climb the wall is showing, as the view has it: whose, its status and its input log. */
  viewClimb: MountMinigameClimb | null;
  /** The pile as the view has it. */
  pile: MountPile;
  rules: MountClimbRules;
  activeTurnTeamId: string | null;
  sceneRef: RefObject<MountSceneHandle>;
  /** The marquee's clock, written every frame. */
  clockRef?: RefObject<HTMLElement>;
  /** What the replay announces, and each ending as the wall starts it; STABLE identity. */
  onEvent?: MountDisplayEventHandler;
};

// How far behind the tablet the wall draws, in ticks: a fifth of a second, longer than BRAWL's
// six because samples arrive in 70 ms batches, so a finger has normally arrived before the
// mirror reaches the tick it applies to (spec §0.5).
export const MIRROR_DELAY_TICKS = 12;

type MirrorRun = {
  key: string;
  start: MountState;
  log: readonly MountInputSample[];
  state: MountState;
  startedAtMs: number | null;
  rafHandle: number;
};

type MirrorBeat = { rafHandle: number; then: (() => void) | null };

const BEAT_DURATION_MS: Record<MountOutcome, number> = { mounted: MOUNT_BEAT_MS, timeout: STUCK_BEAT_MS };

const isSameSample = (a: MountInputSample, b: MountInputSample): boolean => {
  return a.tick === b.tick && a.limb === b.limb && a.kind === b.kind && a.x === b.x && a.y === b.y;
};

/** Whether `next` only adds to `previous` at or after `fromTick`: a log the mirror can carry on with. */
export const isMountLogAppendedFrom = (
  previous: readonly MountInputSample[],
  next: readonly MountInputSample[],
  fromTick: number
): boolean => {
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

    if (!isSameSample(was, entry)) {
      return false;
    }
  }

  return true;
};

const resolveLogKey = (inputs: readonly MountInputSample[]): string => {
  const last = inputs[inputs.length - 1];

  return last === undefined ? "0" : `${inputs.length}:${last.tick}:${last.limb}:${last.kind}`;
};

/**
 * The wall re-runs the tablet's climb from its input log (`useBrawlMirror`'s twin, spec §0.5) on a
 * local clock that starts when the first finger arrives, `MIRROR_DELAY_TICKS` behind. A sample for
 * a tick it has already drawn rebuilds from the top, so the picture is always the log's truth. When
 * the tablet moves on mid-climb the wall finishes the climb it has (the refereed view empties the
 * log, so it keeps its own copy), plays how it ended, and only then draws what the tablet is on. A
 * wall that missed a climb (a reload) draws the refereed hen from the pile. Between climbs and
 * turns it shows the pile still, the next climber stood at the start.
 */
export const useMountMirror = ({
  viewClimb,
  pile,
  rules,
  activeTurnTeamId,
  sceneRef,
  clockRef,
  onEvent
}: MountMirrorInput): { pile: MountPile } => {
  const [shownPile, setShownPile] = useState(pile);
  const runRef = useRef<MirrorRun | null>(null);
  const beatRef = useRef<MirrorBeat | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);
  const inputRef = useRef({ pile, rules, onEvent });
  const [settledCount, markSettled] = useReducer((count: number) => count + 1, 0);

  inputRef.current = { pile, rules, onEvent };

  const climbIndex = viewClimb?.climbIndex ?? null;
  const status = viewClimb?.status ?? null;
  const isSkipped = viewClimb?.skipped ?? false;
  const playerId = viewClimb?.player?.playerId ?? null;
  const inputs = viewClimb?.inputs ?? [];
  const logKey = resolveLogKey(inputs);
  const pileKey = resolvePileKey(pile);

  const paintClock = (state: MountState): void => {
    paintClimbClock(clockRef?.current ?? null, state.climbTicks - state.tick);
  };

  // The loops live on refs and are stopped on purpose, never by an effect's cleanup, so a climb the
  // tablet has already moved past can still play out on the wall.
  const stopLoop = (): void => {
    const run = runRef.current;

    if (run !== null && run.rafHandle !== 0) {
      window.cancelAnimationFrame(run.rafHandle);
      run.rafHandle = 0;
    }
  };

  const stopBeat = (): void => {
    if (beatRef.current !== null && beatRef.current.rafHandle !== 0) {
      window.cancelAnimationFrame(beatRef.current.rafHandle);
    }

    beatRef.current = null;
  };

  const startState = (): MountState => {
    const input = inputRef.current;

    return createMountState(input.pile.seed, input.pile, input.rules, playerId);
  };

  // The next climber stood at the start beside the pile as the view has it.
  const paintStill = (key: string): void => {
    stopLoop();
    stopBeat();

    const state = startState();

    runRef.current = { key, start: state, log: [], state, startedAtMs: null, rafHandle: 0 };
    setShownPile(inputRef.current.pile);
    sceneRef.current?.paint(state);
    paintClock(state);
  };

  // The pile alone, the refereed hen on it: a climb the wall never saw, or the team through.
  const paintSettledPile = (): void => {
    stopLoop();
    setShownPile(inputRef.current.pile);
    sceneRef.current?.paintPile();
  };

  const startBeat = (run: MirrorRun, outcome: MountOutcome): void => {
    stopBeat();

    const startedAtMs = performance.now();
    const beat: MirrorBeat = { rafHandle: 0, then: null };
    const paintBeat = (progress: number): void => {
      if (outcome === "mounted") {
        sceneRef.current?.paintMount(run.state, progress);
      } else {
        sceneRef.current?.paintStuck(run.state, progress);
      }

      paintClock(run.state);
    };
    const step = (now: number): void => {
      const progress = (now - startedAtMs) / BEAT_DURATION_MS[outcome];

      paintBeat(Math.min(1, progress));

      if (progress >= 1) {
        beat.rafHandle = 0;
        beatRef.current = null;

        const pending = pendingRef.current;

        pendingRef.current = null;

        if (pending === null) {
          paintSettledPile();
        } else {
          pending();
        }

        return;
      }

      beat.rafHandle = window.requestAnimationFrame(step);
    };

    beatRef.current = beat;
    inputRef.current.onEvent?.(outcome === "mounted" ? { kind: "mount" } : { kind: "time" });
    paintBeat(0);
    beat.rafHandle = window.requestAnimationFrame(step);
  };

  useEffect(() => {
    if (climbIndex === null || status === null) {
      pendingRef.current = null;
      paintSettledPile();
      return;
    }

    const key = `${activeTurnTeamId ?? ""}:${climbIndex}`;
    const current = runRef.current;

    // The tablet is on another climb than the wall. If the wall is still replaying the old one, or
    // playing its ending, the switch waits behind it.
    if (current !== null && current.key !== key) {
      const isStillRunning = current.startedAtMs !== null && current.state.outcome === null;

      if (isStillRunning || beatRef.current !== null) {
        pendingRef.current = (): void => {
          runRef.current = null;
          markSettled();
        };
        return;
      }
    }

    pendingRef.current = null;

    if (status === "ready" || (status === "done" && isSkipped)) {
      paintStill(key);
      return;
    }

    // A beat is already playing this climb out; nothing new to draw.
    if (beatRef.current !== null && current?.key === key) {
      return;
    }

    // Refereed before the wall drew a frame of it: the hen is already on the view's pile.
    if (status === "done" && (current === null || current.key !== key || current.startedAtMs === null)) {
      paintSettledPile();
      return;
    }

    const run: MirrorRun =
      current !== null && current.key === key
        ? current
        : { key, start: startState(), log: [], state: startState(), startedAtMs: null, rafHandle: 0 };

    stopLoop();
    runRef.current = run;
    run.startedAtMs ??= performance.now();
    setShownPile(run.start.pile);

    const resolveTargetTick = (now: number): number => {
      return Math.max(0, Math.floor(((now - (run.startedAtMs ?? now)) * MOUNT_WORLD.tickHz) / 1000) - MIRROR_DELAY_TICKS);
    };

    // Only a running climb's log is news: once refereed the view empties it, and the wall plays on
    // with the copy it already has.
    if (status === "running") {
      if (!isMountLogAppendedFrom(run.log, inputs, run.state.tick)) {
        run.state = advanceMount(run.start, inputs, Math.max(run.state.tick, resolveTargetTick(performance.now())));
      }

      run.log = inputs;
    }

    const step = (now: number): void => {
      const previous = run.state;

      run.state = advanceMount(run.state, run.log, resolveTargetTick(now));

      for (const event of resolveMirrorEvents(previous, run.state)) {
        inputRef.current.onEvent?.(event);
      }

      if (run.state.falls.length > previous.falls.length) {
        sceneRef.current?.shake();
      }

      if (run.state.outcome !== null) {
        run.rafHandle = 0;
        startBeat(run, run.state.outcome);
        return;
      }

      sceneRef.current?.paint(run.state);
      paintClock(run.state);
      run.rafHandle = window.requestAnimationFrame(step);
    };

    if (run.state.outcome !== null) {
      startBeat(run, run.state.outcome);
      return;
    }

    sceneRef.current?.paint(run.state);
    paintClock(run.state);
    run.rafHandle = window.requestAnimationFrame(step);
    // The dependencies are narrowed by hand: a fresh copy of the same view (every echo is one)
    // must not tear the loop down, only the climb, its status or its log changing.
  }, [climbIndex, status, isSkipped, logKey, pileKey, activeTurnTeamId, settledCount]);

  useEffect(() => {
    return (): void => {
      stopLoop();
      stopBeat();
    };
  }, []);

  return { pile: shownPile };
};
