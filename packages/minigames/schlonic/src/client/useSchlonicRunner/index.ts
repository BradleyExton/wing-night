import { useEffect, useRef, type RefObject } from "react";
import type { SchlonicFrame, SchlonicInput, SchlonicMinigameRun, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, advanceSchlonic, createSchlonicRunStart } from "@wingnight/shared";

import { CLEARED_BEAT_MS, WIPEOUT_BEAT_MS } from "../beats/index.js";
import type { SchlonicSceneHandle } from "../SchlonicScene/index.js";

type SchlonicRunnerInput = {
  run: SchlonicMinigameRun | null;
  zone: SchlonicZone;
  canAct: boolean;
  sceneRef: RefObject<SchlonicSceneHandle>;
  onPress: (tick: number) => void;
  onRelease: (tick: number) => void;
  onEndRun: () => void;
};

type LocalRun = {
  frame: SchlonicFrame;
  inputs: SchlonicInput[];
  startedAtMs: number | null;
  rafHandle: number;
  hasEnded: boolean;
  isDown: boolean;
};

// A beat playing over the run's terminal frame, `progress` 0 → 1: the post crossed, or the run
// that ended where it went wrong. `then` runs when it is over — the next run the server has
// already moved to, held back until the room has seen how this one went.
type LocalBeat = {
  kind: "cleared" | "wipeout";
  frame: SchlonicFrame;
  startedAtMs: number;
  rafHandle: number;
  then: (() => void) | null;
};

const BEAT_DURATION_MS: Record<LocalBeat["kind"], number> = {
  cleared: CLEARED_BEAT_MS,
  wipeout: WIPEOUT_BEAT_MS
};

/**
 * The tablet plays the run itself: a fixed-step sim on the local clock, painted every animation
 * frame, with the button logged at the tick it landed on and each edge sent to the server as one
 * action. The server's echo of the log is not what drives this loop — the local copy is — so the
 * runner answers the finger with zero round trips. When the local sim reaches an outcome the run
 * is reported ended; the server re-runs the same log and takes its own reading, which is the only
 * one that scores. The outcome is then played as a beat before the next run is drawn.
 */
export const useSchlonicRunner = ({
  run,
  zone,
  canAct,
  sceneRef,
  onPress,
  onRelease,
  onEndRun
}: SchlonicRunnerInput): { press: () => void; release: () => void } => {
  const runIndex = run?.runIndex ?? null;
  const runStatus = run?.status ?? null;
  const createLocalRun = (): LocalRun => ({
    frame: createSchlonicRunStart(zone),
    inputs: [],
    startedAtMs: null,
    rafHandle: 0,
    hasEnded: false,
    isDown: false
  });
  const runRef = useRef<LocalRun | null>(null);
  const beatRef = useRef<LocalBeat | null>(null);
  const zoneRef = useRef(zone);
  const onPressRef = useRef(onPress);
  const onReleaseRef = useRef(onRelease);
  const onEndRunRef = useRef(onEndRun);
  const localRunRef = useRef(run);
  const canActRef = useRef(canAct);

  if (runRef.current === null) {
    runRef.current = createLocalRun();
  }

  zoneRef.current = zone;
  onPressRef.current = onPress;
  onReleaseRef.current = onRelease;
  onEndRunRef.current = onEndRun;
  localRunRef.current = run;
  canActRef.current = canAct;

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

  const startBeat = (kind: LocalBeat["kind"], frame: SchlonicFrame): void => {
    stopBeat();

    const beat: LocalBeat = { kind, frame, startedAtMs: performance.now(), rafHandle: 0, then: null };
    const paintBeat = (progress: number): void => {
      if (kind === "cleared") {
        sceneRef.current?.paintCleared(frame, progress);
      } else {
        sceneRef.current?.paintWipeout(frame, progress);
      }
    };
    const step = (now: number): void => {
      const progress = (now - beat.startedAtMs) / BEAT_DURATION_MS[kind];

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
    paintBeat(0);
    beat.rafHandle = window.requestAnimationFrame(step);
  };

  const step = (now: number): void => {
    const local = runRef.current;

    if (local === null || local.startedAtMs === null) {
      return;
    }

    const targetTick = Math.floor(((now - local.startedAtMs) * SCHLONIC_WORLD.tickHz) / 1000);

    local.frame = advanceSchlonic(local.frame, zoneRef.current, local.inputs, targetTick);

    if (local.frame.outcome !== null) {
      local.rafHandle = 0;
      startBeat(local.frame.outcome === "cleared" ? "cleared" : "wipeout", local.frame);

      if (!local.hasEnded) {
        local.hasEnded = true;
        onEndRunRef.current();
      }

      return;
    }

    sceneRef.current?.paint(local.frame);
    local.rafHandle = window.requestAnimationFrame(step);
  };

  // Follow the run the server says we are on. A `ready` run starts a fresh local run on the line
  // — after the previous one's beat, if one is still playing; a `running` one with no local run
  // is a tablet that mounted mid-run (a reload), so hand the server what it has rather than
  // pretend to resume a run nobody is taking.
  useEffect(() => {
    if (runIndex === null || runStatus === null) {
      stopLoop();
      stopBeat();
      runRef.current = createLocalRun();
      return;
    }

    if (runStatus === "ready") {
      const restart = (): void => {
        stopLoop();
        runRef.current = createLocalRun();
        sceneRef.current?.paint(runRef.current.frame);
      };
      const beat = beatRef.current;

      if (beat !== null) {
        beat.then = restart;
        return;
      }

      restart();
      return;
    }

    if (runStatus === "running" && runRef.current?.startedAtMs === null) {
      if (!runRef.current.hasEnded) {
        runRef.current.hasEnded = true;
        onEndRunRef.current();
      }
    }
  }, [runIndex, runStatus, sceneRef]);

  useEffect(() => {
    return (): void => {
      stopLoop();
      stopBeat();
    };
  }, []);

  const isArmed = (): boolean => {
    const local = runRef.current;

    return (
      local !== null &&
      canActRef.current &&
      localRunRef.current !== null &&
      localRunRef.current.status !== "done" &&
      !local.hasEnded &&
      local.frame.outcome === null &&
      beatRef.current === null
    );
  };

  // Down jumps off the floor; the log carries the edge either way, because a jump that is let go
  // of early is a shorter one and the server has to be able to see that.
  const press = (): void => {
    const local = runRef.current;

    if (local === null || !isArmed() || local.isDown) {
      return;
    }

    if (local.startedAtMs === null) {
      local.startedAtMs = performance.now();
      local.frame = createSchlonicRunStart(zoneRef.current);
      local.inputs = [];
    }

    const tick = local.frame.tick;

    local.isDown = true;
    local.inputs.push({ tick, down: true });
    onPressRef.current(tick);

    if (local.rafHandle === 0) {
      local.rafHandle = window.requestAnimationFrame(step);
    }
  };

  const release = (): void => {
    const local = runRef.current;

    if (local === null || !local.isDown) {
      return;
    }

    local.isDown = false;

    if (!isArmed() || local.startedAtMs === null) {
      return;
    }

    const lastInput = local.inputs[local.inputs.length - 1];
    // The log is strictly ascending: a release on the same tick as its press would be refused by
    // the server, so it lands on the next one — which is also how it felt to the player.
    const tick = Math.max(local.frame.tick, (lastInput?.tick ?? 0) + 1);

    local.inputs.push({ tick, down: false });
    onReleaseRef.current(tick);
  };

  return { press, release };
};
