import { useEffect, useMemo, useRef, type RefObject } from "react";
import type { FappyFrame, FappyMinigameLeg } from "@wingnight/shared";
import {
  FAPPY_WORLD,
  advanceFappy,
  createFappyLegStart,
  resolveFappyGates,
  runFappyLeg
} from "@wingnight/shared";

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

// The tablet plays the attempt itself: a fixed-step sim on the local clock,
// painted every animation frame, with each tap logged at the tick it landed
// on and sent to the server as one action. The server's echo of the log is
// not what drives this loop — the local copy is — so the bird answers the
// finger with zero round trips. When the local sim reaches an outcome the
// attempt is reported ended; the server re-runs the same log from the same
// checkpoint and decides whether the bird cleared or respawns.
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

  const step = (now: number): void => {
    const run = runRef.current;

    if (run === null || run.startedAtMs === null) {
      return;
    }

    const targetTick = Math.floor(((now - run.startedAtMs) * FAPPY_WORLD.tickHz) / 1000);

    run.frame = advanceFappy(run.frame, gates, gatesPerLeg, run.flapTicks, targetTick);
    sceneRef.current?.paint(run.frame);

    if (run.frame.outcome !== null) {
      run.rafHandle = 0;

      if (!run.hasEnded) {
        run.hasEnded = true;
        onEndLegRef.current();
      }

      return;
    }

    run.rafHandle = window.requestAnimationFrame(step);
  };

  // Follow the attempt the server says we are on. A `ready` attempt (the first
  // one, the one after a crash, the next leg) starts a fresh local run on its
  // checkpoint; a `flying` one with no local run is a tablet that mounted
  // mid-flight (a reload), so settle it from the log rather than pretend to
  // resume a flight nobody is flying; a `cleared` leg holds its landing.
  useEffect(() => {
    const currentLeg = legRef.current;

    if (currentLeg === null || legStatus === null) {
      stopLoop();
      runRef.current = createRun();
      return undefined;
    }

    if (legStatus === "ready") {
      stopLoop();
      runRef.current = createRun();
      sceneRef.current?.paint(runRef.current.frame);
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

      const settled = currentLeg.skipped
        ? createFappyLegStart(gates, gatesPerLeg, knockedEagles)
        : runFappyLeg(
            { seed: legSeed, legIndex: currentLeg.legIndex, gatesPerLeg },
            currentLeg.flapTicks,
            currentLeg.checkpointGate,
            currentLeg.knockedEagles
          ).frame;

      runRef.current = { ...createRun(), frame: settled, hasEnded: true };
      sceneRef.current?.paint(settled);
    }

    return undefined;
  }, [legIndex, legSeed, legStatus, attempt, checkpointGate, knockedEaglesKey, gatesPerLeg]);

  useEffect(() => {
    return (): void => {
      stopLoop();
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
      run.frame.outcome !== null
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
