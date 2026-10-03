import { useEffect, useRef, useState, type RefObject } from "react";
import {
  MOUNT_WORLD,
  createMountState,
  stepMount,
  type MountClimbRules,
  type MountInputSample,
  type MountMinigameClimb,
  type MountOutcome,
  type MountPile,
  type MountState,
  type MountVec
} from "@wingnight/shared";

import { MOUNT_BEAT_MS, STUCK_BEAT_MS } from "../beats/index.js";
import { paintClimbClock } from "../climbClock/index.js";
import { pickMountLimb, quantiseMountPoint } from "../limbTouch/index.js";
import { resolveMirrorEvents, type MountDisplayEventHandler } from "../mirrorEvents/index.js";
import type { MountSceneHandle } from "../MountScene/index.js";
import { resolvePileKey } from "../MountScene/pileKey/index.js";
import { createRunFingers, type RunFingers } from "./fingers/index.js";

/** Whose turn and which climb an action is for: the runtime refuses one stamped for another. */
export type MountStamp = { teamId?: string; climbIndex: number };

export type MountRunnerInput = {
  /** The climb the surface is showing, as the view has it: whose, and ready, running or done. */
  viewClimb: MountMinigameClimb | null;
  /** The pile as the view has it: what the next climb starts on. */
  pile: MountPile;
  rules: MountClimbRules;
  activeTurnTeamId: string | null;
  canAct: boolean;
  sceneRef: RefObject<MountSceneHandle>;
  /** Where the climb's clock is written each frame: the counter's digits, outside the scene. */
  clockRef?: RefObject<HTMLElement>;
  onLimb: (stamp: MountStamp, samples: MountInputSample[]) => void;
  onEndClimb: (stamp: MountStamp) => void;
  /** The climb's sound events, for a tablet that is its own speaker (solo); absent on the night. */
  onEvent?: MountDisplayEventHandler;
};

export type MountRunner = {
  /** The pile the scene should draw: the one the local climb started on, until its beat is over. */
  pile: MountPile;
  /** A finger landed: takes the nearest free limb, and starts the clock on the first one. */
  touchStart: (pointerId: number, point: MountVec) => boolean;
  touchMove: (pointerId: number, point: MountVec) => void;
  touchEnd: (pointerId: number) => void;
};

type LocalRun = {
  stamp: MountStamp;
  state: MountState;
  log: MountInputSample[];
  sent: number;
  startedAtMs: number | null;
  rafHandle: number;
  flushHandle: number;
  hasEnded: boolean;
  fingers: RunFingers;
};

type LocalBeat = { rafHandle: number; then: () => void };

// DRAWING's rate: the wire carries fourteen batches a second, not sixty samples.
export const LIMB_FLUSH_MS = 70;

const BEAT_DURATION_MS: Record<MountOutcome, number> = { mounted: MOUNT_BEAT_MS, timeout: STUCK_BEAT_MS };

/** The samples logged at the state's own tick: they are always the log's tail. */
const samplesAtTick = (log: readonly MountInputSample[], tick: number): MountInputSample[] => {
  let start = log.length;

  while (start > 0 && (log[start - 1]?.tick ?? -1) >= tick) {
    start -= 1;
  }

  return log.slice(start).filter((sample) => sample.tick === tick);
};

/**
 * The tablet climbs the climb itself (`useBrawlRunner`'s twin, spec §0.5): a fixed-step sim on the
 * local clock, painted every animation frame, with every finger logged at the tick it landed on
 * and flushed to the server in 70 ms batches. The server's echo never drives this loop, so the
 * hen answers the finger with no round trip. The clock starts on the first touch. When the local
 * sim is terminal the climb is reported ended (stamped); the server re-runs the same log and takes
 * its own reading, which is the only one that scores. The ending then plays as a beat.
 */
export const useMountRunner = ({
  viewClimb,
  pile,
  rules,
  activeTurnTeamId,
  canAct,
  sceneRef,
  clockRef,
  onLimb,
  onEndClimb,
  onEvent
}: MountRunnerInput): MountRunner => {
  const climbIndex = viewClimb?.climbIndex ?? null;
  const status = viewClimb?.status ?? null;
  const playerId = viewClimb?.player?.playerId ?? null;
  const pileKey = resolvePileKey(pile);
  const [shownPile, setShownPile] = useState(pile);
  const inputRef = useRef({ pile, rules, activeTurnTeamId, playerId, canAct, viewClimb });
  const callbacksRef = useRef({ onLimb, onEndClimb, onEvent });
  const runRef = useRef<LocalRun | null>(null);
  const beatRef = useRef<LocalBeat | null>(null);

  inputRef.current = { pile, rules, activeTurnTeamId, playerId, canAct, viewClimb };
  callbacksRef.current = { onLimb, onEndClimb, onEvent };

  const stampFor = (index: number): MountStamp => {
    const teamId = inputRef.current.activeTurnTeamId;

    return teamId === null ? { climbIndex: index } : { teamId, climbIndex: index };
  };

  const createLocalRun = (index: number): LocalRun => {
    const input = inputRef.current;

    return {
      stamp: stampFor(index),
      state: createMountState(input.pile.seed, input.pile, input.rules, input.playerId),
      log: [],
      sent: 0,
      startedAtMs: null,
      rafHandle: 0,
      flushHandle: 0,
      hasEnded: false,
      fingers: createRunFingers()
    };
  };

  const stopRun = (local: LocalRun | null): void => {
    if (local === null) {
      return;
    }

    if (local.rafHandle !== 0) {
      window.cancelAnimationFrame(local.rafHandle);
      local.rafHandle = 0;
    }

    if (local.flushHandle !== 0) {
      window.clearInterval(local.flushHandle);
      local.flushHandle = 0;
    }
  };

  const stopBeat = (): void => {
    if (beatRef.current !== null && beatRef.current.rafHandle !== 0) {
      window.cancelAnimationFrame(beatRef.current.rafHandle);
    }

    beatRef.current = null;
  };

  const flush = (local: LocalRun): void => {
    if (local.log.length > local.sent) {
      callbacksRef.current.onLimb(local.stamp, local.log.slice(local.sent));
      local.sent = local.log.length;
    }
  };

  const paintClock = (state: MountState): void => {
    paintClimbClock(clockRef?.current ?? null, state.climbTicks - state.tick);
  };

  // Nobody climbing: the pile as the view has it now, the climber gone.
  const settle = (): void => {
    setShownPile(inputRef.current.pile);
    sceneRef.current?.paintPile();
  };

  const restart = (index: number): void => {
    stopRun(runRef.current);
    runRef.current = createLocalRun(index);
    setShownPile(inputRef.current.pile);
    sceneRef.current?.holdCamera(false);
    sceneRef.current?.paint(runRef.current.state);
    paintClock(runRef.current.state);
  };

  const startBeat = (state: MountState, outcome: MountOutcome): void => {
    stopBeat();

    const startedAtMs = performance.now();
    const beat: LocalBeat = { rafHandle: 0, then: settle };
    const paintBeat = (progress: number): void => {
      if (outcome === "mounted") {
        sceneRef.current?.paintMount(state, progress);
      } else {
        sceneRef.current?.paintStuck(state, progress);
      }

      paintClock(state);
    };
    const step = (now: number): void => {
      const progress = (now - startedAtMs) / BEAT_DURATION_MS[outcome];

      paintBeat(Math.min(1, progress));

      if (progress >= 1) {
        beat.rafHandle = 0;
        beatRef.current = null;
        beat.then();
        return;
      }

      beat.rafHandle = window.requestAnimationFrame(step);
    };

    beatRef.current = beat;
    callbacksRef.current.onEvent?.(outcome === "mounted" ? { kind: "mount" } : { kind: "time" });
    paintBeat(0);
    beat.rafHandle = window.requestAnimationFrame(step);
  };

  const endClimb = (local: LocalRun): void => {
    stopRun(local);
    flush(local);
    local.hasEnded = true;
    local.fingers.clear();
    sceneRef.current?.holdCamera(false);
    callbacksRef.current.onEndClimb(local.stamp);
  };

  const step = (now: number): void => {
    const local = runRef.current;

    if (local === null || local.startedAtMs === null || local.hasEnded) {
      return;
    }

    const targetTick = Math.floor(((now - local.startedAtMs) * MOUNT_WORLD.tickHz) / 1000);
    const previous = local.state;

    while (local.state.outcome === null && local.state.tick < targetTick) {
      local.fingers.logDueMoves(local.state, local.log);
      local.state = stepMount(local.state, samplesAtTick(local.log, local.state.tick));
    }

    const listener = callbacksRef.current.onEvent;

    if (listener !== undefined) {
      for (const event of resolveMirrorEvents(previous, local.state)) {
        listener(event);
      }
    }

    // A fall drops every finger's hold on its limb: lift and touch again (spec §0.5).
    if (local.state.falls.length > previous.falls.length) {
      local.fingers.clear();
      sceneRef.current?.holdCamera(false);
      sceneRef.current?.shake();
    }

    if (local.state.outcome !== null) {
      endClimb(local);
      startBeat(local.state, local.state.outcome);
      return;
    }

    sceneRef.current?.paint(local.state);
    paintClock(local.state);
    local.rafHandle = window.requestAnimationFrame(step);
  };

  // Follow the climb the surface shows. A `ready` climb gets a fresh local run at the start
  // stance, after the last one's beat if it is still playing. A `running` one with no local run is
  // a tablet that mounted mid-climb (a reload): hand the server what it has rather than pretend to
  // resume a climb nobody is touching. A climb that went `done` under a live run was skipped: the
  // loop stops where it is, and the pile is shown once any beat is over.
  useEffect(() => {
    if (climbIndex === null || status === null) {
      stopRun(runRef.current);
      stopBeat();
      runRef.current = null;
      settle();
      return;
    }

    if (status === "ready") {
      const beat = beatRef.current;

      if (beat !== null) {
        beat.then = (): void => restart(climbIndex);
        return;
      }

      restart(climbIndex);
      return;
    }

    const local = runRef.current;

    if (status === "running") {
      if (local !== null && local.startedAtMs === null && !local.hasEnded) {
        local.hasEnded = true;
        callbacksRef.current.onEndClimb(local.stamp);
      }

      return;
    }

    if (local !== null && !local.hasEnded) {
      stopRun(local);
      local.hasEnded = true;
      local.fingers.clear();
    }

    if (beatRef.current === null) {
      settle();
    } else {
      beatRef.current.then = settle;
    }
    // The dependencies are narrowed by hand: a fresh copy of the same view (every echo is one)
    // must never tear a climb down, only the climb, its status, the pile or the turn changing.
  }, [climbIndex, status, pileKey, activeTurnTeamId]);

  useEffect(() => {
    return (): void => {
      stopRun(runRef.current);
      stopBeat();
    };
  }, []);

  const isArmed = (local: LocalRun): boolean => {
    const input = inputRef.current;

    return (
      input.canAct &&
      input.viewClimb !== null &&
      input.viewClimb.status !== "done" &&
      !local.hasEnded &&
      local.state.outcome === null &&
      beatRef.current === null
    );
  };

  const touchStart = (pointerId: number, point: MountVec): boolean => {
    const local = runRef.current;

    if (local === null || !isArmed(local) || local.state.tick < local.state.recoveringUntilTick) {
      return false;
    }

    const limb = pickMountLimb(point, local.state.pose, local.fingers.ownedLimbs());

    if (limb === null) {
      return false;
    }

    if (local.startedAtMs === null) {
      local.startedAtMs = performance.now();
      local.flushHandle = window.setInterval(() => flush(local), LIMB_FLUSH_MS);
    }

    local.fingers.grab(pointerId, limb, quantiseMountPoint(point), local.state, local.log);
    sceneRef.current?.holdCamera(true);

    if (local.rafHandle === 0) {
      local.rafHandle = window.requestAnimationFrame(step);
    }

    return true;
  };

  const touchMove = (pointerId: number, point: MountVec): void => {
    const local = runRef.current;

    if (local !== null && isArmed(local)) {
      local.fingers.move(pointerId, quantiseMountPoint(point), local.state, local.log);
    }
  };

  const touchEnd = (pointerId: number): void => {
    const local = runRef.current;

    if (local === null) {
      return;
    }

    if (isArmed(local)) {
      local.fingers.release(pointerId, local.state, local.log);
    } else {
      local.fingers.drop(pointerId);
    }

    if (local.fingers.count() === 0) {
      sceneRef.current?.holdCamera(false);
    }
  };

  return { pile: shownPile, touchStart, touchMove, touchEnd };
};
