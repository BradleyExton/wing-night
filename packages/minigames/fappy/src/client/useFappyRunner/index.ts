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

const createLocalRun = (): LocalRun => {
  return {
    frame: createFappyLegStart(),
    flapTicks: [],
    startedAtMs: null,
    rafHandle: 0,
    hasEnded: false
  };
};

// The tablet plays the leg itself: a fixed-step sim on the local clock,
// painted every animation frame, with each tap logged at the tick it landed
// on and sent to the server as one action. The server's echo of the log is
// not what drives this loop — the local copy is — so the bird answers the
// finger with zero round trips. When the local sim reaches an outcome the
// leg is reported ended; the server re-runs the same log and keeps its own
// count.
export const useFappyRunner = ({
  leg,
  gatesPerLeg,
  canAct,
  sceneRef,
  onFlap,
  onEndLeg
}: FappyRunnerInput): { flap: () => void } => {
  const runRef = useRef<LocalRun>(createLocalRun());
  const onFlapRef = useRef(onFlap);
  const onEndLegRef = useRef(onEndLeg);
  const legRef = useRef(leg);
  const canActRef = useRef(canAct);
  const legIndex = leg?.legIndex ?? null;
  const legSeed = leg?.seed ?? 0;
  const legStatus = leg?.status ?? null;
  const gates = useMemo(() => {
    return legIndex === null
      ? []
      : resolveFappyGates({ seed: legSeed, legIndex, gatesPerLeg });
  }, [legIndex, legSeed, gatesPerLeg]);

  onFlapRef.current = onFlap;
  onEndLegRef.current = onEndLeg;
  legRef.current = leg;
  canActRef.current = canAct;

  const stopLoop = (): void => {
    if (runRef.current.rafHandle !== 0) {
      window.cancelAnimationFrame(runRef.current.rafHandle);
      runRef.current.rafHandle = 0;
    }
  };

  const step = (now: number): void => {
    const run = runRef.current;

    if (run.startedAtMs === null) {
      run.rafHandle = 0;
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

  // Follow the leg the server says we are on. A leg that comes back `ready`
  // (a redo, a reset, the next leg) clears the local run; one that is already
  // `flying` with no local run is a tablet that mounted mid-leg (a reload), so
  // settle it from the log rather than pretend to resume a flight nobody is
  // flying; a `landed` leg holds the server's final frame.
  useEffect(() => {
    const currentLeg = legRef.current;

    if (currentLeg === null || legStatus === null) {
      stopLoop();
      runRef.current = createLocalRun();
      return undefined;
    }

    if (legStatus === "ready") {
      stopLoop();
      runRef.current = createLocalRun();
      sceneRef.current?.paint(runRef.current.frame);
      return undefined;
    }

    if (legStatus === "flying" && runRef.current.startedAtMs === null) {
      if (!runRef.current.hasEnded) {
        runRef.current.hasEnded = true;
        onEndLegRef.current();
      }
      return undefined;
    }

    if (legStatus === "landed") {
      stopLoop();

      const settled =
        currentLeg.outcome === "skipped"
          ? createFappyLegStart()
          : runFappyLeg(
              { seed: legSeed, legIndex: currentLeg.legIndex, gatesPerLeg },
              currentLeg.flapTicks
            ).frame;

      runRef.current = { ...createLocalRun(), frame: settled, hasEnded: true };
      sceneRef.current?.paint(settled);
    }

    return undefined;
  }, [legIndex, legSeed, legStatus, gatesPerLeg]);

  useEffect(() => {
    return (): void => {
      stopLoop();
    };
  }, []);

  const flap = (): void => {
    const run = runRef.current;
    const currentLeg = legRef.current;

    if (
      !canActRef.current ||
      currentLeg === null ||
      currentLeg.status === "landed" ||
      run.hasEnded ||
      run.frame.outcome !== null
    ) {
      return;
    }

    if (run.startedAtMs === null) {
      run.startedAtMs = performance.now();
      run.frame = createFappyLegStart();
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
