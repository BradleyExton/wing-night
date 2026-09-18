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

type FappyMirrorInput = {
  leg: FappyMinigameLeg | null;
  gatesPerLeg: number;
  sceneRef: RefObject<FappySceneHandle>;
};

// How far behind the tablet the TV draws, in ticks: a tenth of a second, so a
// flap has normally arrived before the mirror reaches the tick it applies to
// and the bird on the wall does not dip before it lifts.
const MIRROR_DELAY_TICKS = 6;

type MirrorRun = {
  frame: FappyFrame;
  startedAtMs: number | null;
  rafHandle: number;
};

const prefersReducedMotion = (): boolean => {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

// The display re-runs the tablet's leg from its flap log on a local clock
// that starts when the first flap arrives, a few ticks behind. A flap that
// arrives for a tick the mirror has already drawn re-simulates from the top
// — a few hundred trivial steps — so the picture is always the log's truth,
// never a guess. No clock is synchronised with anything.
export const useFappyMirror = ({ leg, gatesPerLeg, sceneRef }: FappyMirrorInput): void => {
  const runRef = useRef<MirrorRun>({ frame: createFappyLegStart(), startedAtMs: null, rafHandle: 0 });
  const legIndex = leg?.legIndex ?? null;
  const legSeed = leg?.seed ?? 0;
  const legStatus = leg?.status ?? null;
  const legOutcome = leg?.outcome ?? null;
  const flapTicks = useMemo(() => leg?.flapTicks ?? [], [leg]);
  const flapLogKey = flapTicks.join(",");
  const gates = useMemo(() => {
    return legIndex === null
      ? []
      : resolveFappyGates({ seed: legSeed, legIndex, gatesPerLeg });
  }, [legIndex, legSeed, gatesPerLeg]);

  useEffect(() => {
    const run = runRef.current;

    const stopLoop = (): void => {
      if (run.rafHandle !== 0) {
        window.cancelAnimationFrame(run.rafHandle);
        run.rafHandle = 0;
      }
    };

    const holdStart = (): void => {
      stopLoop();
      run.startedAtMs = null;
      run.frame = createFappyLegStart();
      sceneRef.current?.paint(run.frame);
    };

    if (legIndex === null || legStatus === null || legStatus === "ready") {
      holdStart();
      return stopLoop;
    }

    const course = { seed: legSeed, legIndex, gatesPerLeg };

    if (legStatus === "landed" && legOutcome === "skipped") {
      holdStart();
      return stopLoop;
    }

    // The flight is the game, not decoration — but a viewer who asked for
    // less motion still gets the outcome, just without the flight.
    if (legStatus === "landed" && (prefersReducedMotion() || run.startedAtMs === null)) {
      stopLoop();
      run.frame = runFappyLeg(course, flapTicks).frame;
      sceneRef.current?.paint(run.frame);
      return stopLoop;
    }

    if (run.startedAtMs === null) {
      run.startedAtMs = performance.now();
      run.frame = createFappyLegStart();
    }

    const resolveTargetTick = (now: number): number => {
      return Math.max(
        0,
        Math.floor(((now - (run.startedAtMs ?? now)) * FAPPY_WORLD.tickHz) / 1000) - MIRROR_DELAY_TICKS
      );
    };

    // The log changed under a running mirror: rebuild the frame from the top
    // with the log as it now is, up to where the clock says we are.
    run.frame = advanceFappy(
      createFappyLegStart(),
      gates,
      gatesPerLeg,
      flapTicks,
      Math.max(run.frame.tick, resolveTargetTick(performance.now()))
    );
    sceneRef.current?.paint(run.frame);

    if (run.frame.outcome !== null) {
      stopLoop();
      return stopLoop;
    }

    const step = (now: number): void => {
      run.frame = advanceFappy(run.frame, gates, gatesPerLeg, flapTicks, resolveTargetTick(now));
      sceneRef.current?.paint(run.frame);

      if (run.frame.outcome !== null) {
        run.rafHandle = 0;
        return;
      }

      run.rafHandle = window.requestAnimationFrame(step);
    };

    stopLoop();
    run.rafHandle = window.requestAnimationFrame(step);

    return stopLoop;
  }, [legIndex, legSeed, legStatus, legOutcome, flapLogKey, gates, gatesPerLeg, sceneRef]);
};
