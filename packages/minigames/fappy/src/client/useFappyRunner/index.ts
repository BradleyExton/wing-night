import { useEffect, useMemo, useRef, type RefObject } from "react";
import type { FappyFrame, FappyMinigameLeg } from "@wingnight/shared";
import {
  FAPPY_WORLD,
  advanceFappy,
  createFappyLegLanding,
  createFappyLegStart,
  resolveFappyGates,
  runFappyLeg
} from "@wingnight/shared";

import { CRASH_BEAT_MS, HANDOFF_BEAT_MS } from "../beats/index.js";
import type { FappySceneHandle } from "../FappyScene/index.js";

type FappyRunnerInput = {
  leg: FappyMinigameLeg | null;
  gatesPerLeg: number;
  canAct: boolean;
  sceneRef: RefObject<FappySceneHandle>;
  onFlap: (tick: number) => void;
  onEndLeg: () => void;
};

type LocalRun = {
  frame: FappyFrame;
  flapTicks: number[];
  startedAtMs: number | null;
  rafHandle: number;
  hasEnded: boolean;
};

// A beat playing over the run's terminal frame: the crash before a respawn,
// or the landing that hands the tablet on. `then` runs when it is over —
// the respawn the server has already sent, held back until the crash has
// been seen.
type LocalBeat = {
  kind: "crash" | "handoff";
  frame: FappyFrame;
  startedAtMs: number;
  rafHandle: number;
  then: (() => void) | null;
};

const BEAT_DURATION_MS: Record<LocalBeat["kind"], number> = {
  crash: CRASH_BEAT_MS,
  handoff: HANDOFF_BEAT_MS
};

// The tablet plays the attempt itself: a fixed-step sim on the local clock,
// painted every animation frame, with each tap logged at the tick it landed
// on and sent to the server as one action. The server's echo of the log is
// not what drives this loop — the local copy is — so the bird answers the
// finger with zero round trips. When the local sim reaches an outcome the
// attempt is reported ended; the server re-runs the same log from the same
// checkpoint and decides whether the bird cleared or respawns. The outcome
// is then played as a beat before the next attempt or leg is drawn.
export const useFappyRunner = ({
  leg,
  gatesPerLeg,
  canAct,
  sceneRef,
  onFlap,
  onEndLeg
}: FappyRunnerInput): { flap: () => void } => {
  const legIndex = leg?.legIndex ?? null;
  const legSeed = leg?.seed ?? 0;
  const legStatus = leg?.status ?? null;
  const attempt = leg?.attempt ?? 0;
  const checkpointGate = leg?.checkpointGate ?? 0;
  const knockedEagles = useMemo(() => leg?.knockedEagles ?? [], [leg]);
  const knockedEaglesKey = knockedEagles.join(",");
  const gates = useMemo(() => {
    return legIndex === null
      ? []
      : resolveFappyGates({ seed: legSeed, legIndex, gatesPerLeg });
  }, [legIndex, legSeed, gatesPerLeg]);
  const createRun = (): LocalRun => {
    return {
      frame: createFappyLegStart(gates, checkpointGate, knockedEagles),
      flapTicks: [],
      startedAtMs: null,
      rafHandle: 0,
      hasEnded: false
    };
  };
  const runRef = useRef<LocalRun | null>(null);
  const beatRef = useRef<LocalBeat | null>(null);
  const onFlapRef = useRef(onFlap);
  const onEndLegRef = useRef(onEndLeg);
  const legRef = useRef(leg);
  const canActRef = useRef(canAct);

  if (runRef.current === null) {
    runRef.current = createRun();
  }

  onFlapRef.current = onFlap;
  onEndLegRef.current = onEndLeg;
  legRef.current = leg;
  canActRef.current = canAct;

  const stopLoop = (): void => {
    const run = runRef.current;

    if (run !== null && run.rafHandle !== 0) {
      window.cancelAnimationFrame(run.rafHandle);
      run.rafHandle = 0;
    }
  };

  const stopBeat = (): void => {
    const beat = beatRef.current;

    if (beat !== null && beat.rafHandle !== 0) {
      window.cancelAnimationFrame(beat.rafHandle);
    }

    beatRef.current = null;
  };

  const startBeat = (kind: LocalBeat["kind"], frame: FappyFrame): void => {
    stopBeat();

    const beat: LocalBeat = { kind, frame, startedAtMs: performance.now(), rafHandle: 0, then: null };
    const paintBeat = (progress: number): void => {
      if (kind === "crash") {
        sceneRef.current?.paintCrash(frame, progress);
      } else {
        sceneRef.current?.paintHandoff(frame, progress);
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
    const run = runRef.current;

    if (run === null || run.startedAtMs === null) {
      return;
    }

    const targetTick = Math.floor(((now - run.startedAtMs) * FAPPY_WORLD.tickHz) / 1000);

    run.frame = advanceFappy(run.frame, gates, gatesPerLeg, run.flapTicks, targetTick);

    if (run.frame.outcome !== null) {
      run.rafHandle = 0;
      startBeat(run.frame.outcome === "crashed" ? "crash" : "handoff", run.frame);

      if (!run.hasEnded) {
        run.hasEnded = true;
        onEndLegRef.current();
      }

      return;
    }

    sceneRef.current?.paint(run.frame);
    run.rafHandle = window.requestAnimationFrame(step);
  };

  // Follow the attempt the server says we are on. A `ready` attempt (the first
  // one, the one after a crash, the next leg) starts a fresh local run on its
  // checkpoint — after the crash beat, if one is still playing; a `flying`
  // one with no local run is a tablet that mounted mid-flight (a reload), so
  // settle it from the log rather than pretend to resume a flight nobody is
  // flying; a `cleared` leg holds its landing while the handoff beat plays.
  useEffect(() => {
    const currentLeg = legRef.current;

    if (currentLeg === null || legStatus === null) {
      stopLoop();
      stopBeat();
      runRef.current = createRun();
      return undefined;
    }

    if (legStatus === "ready") {
      const restart = (): void => {
        stopLoop();
        runRef.current = createRun();
        sceneRef.current?.paint(runRef.current.frame);
      };
      const beat = beatRef.current;

      if (beat !== null && beat.kind === "crash" && currentLeg.attempt > 0) {
        beat.then = restart;
      } else {
        stopBeat();
        restart();
      }

      return undefined;
    }

    if (legStatus === "flying" && runRef.current?.startedAtMs === null) {
      if (!runRef.current.hasEnded) {
        runRef.current.hasEnded = true;
        onEndLegRef.current();
      }
      return undefined;
    }

    if (legStatus === "cleared") {
      stopLoop();

      if (beatRef.current?.kind === "handoff") {
        return undefined;
      }

      const settled = currentLeg.skipped
        ? createFappyLegLanding(gates, gatesPerLeg, knockedEagles)
        : runFappyLeg(
            { seed: legSeed, legIndex: currentLeg.legIndex, gatesPerLeg },
            currentLeg.flapTicks,
            currentLeg.checkpointGate,
            currentLeg.knockedEagles
          ).frame;

      runRef.current = { ...createRun(), frame: settled, hasEnded: true };
      startBeat("handoff", settled);
    }

    return undefined;
  }, [legIndex, legSeed, legStatus, attempt, checkpointGate, knockedEaglesKey, gatesPerLeg]);

  useEffect(() => {
    return (): void => {
      stopLoop();
      stopBeat();
    };
  }, []);

  const flap = (): void => {
    const run = runRef.current;
    const currentLeg = legRef.current;

    if (
      run === null ||
      !canActRef.current ||
      currentLeg === null ||
      currentLeg.status === "cleared" ||
      run.hasEnded ||
      run.frame.outcome !== null ||
      beatRef.current !== null
    ) {
      return;
    }

    if (run.startedAtMs === null) {
      run.startedAtMs = performance.now();
      run.frame = createFappyLegStart(gates, checkpointGate, knockedEagles);
      run.flapTicks = [];
    }

    const tick = run.frame.tick;

    run.flapTicks.push(tick);
    onFlapRef.current(tick);

    if (run.rafHandle === 0) {
      run.rafHandle = window.requestAnimationFrame(step);
    }
  };

  return { flap };
};
