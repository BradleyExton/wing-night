import { useEffect, useMemo, useReducer, useRef, type RefObject } from "react";
import type { FappyFrame, FappyGate, FappyMinigameLeg } from "@wingnight/shared";
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

type FappyMirrorInput = {
  leg: FappyMinigameLeg | null;
  gatesPerLeg: number;
  sceneRef: RefObject<FappySceneHandle>;
};

// How far behind the tablet the TV draws, in ticks: a tenth of a second, so a
// flap has normally arrived before the mirror reaches the tick it applies to
// and the bird on the wall does not dip before it lifts.
const MIRROR_DELAY_TICKS = 6;

// One attempt as the wall is replaying it. The mirror keeps its own copy of
// the log, because the server wipes a crashed attempt's log the instant it
// respawns the bird — before the wall has drawn the crash.
type MirrorRun = {
  key: string;
  gates: readonly FappyGate[];
  gatesPerLeg: number;
  flapTicks: readonly number[];
  frame: FappyFrame;
  startedAtMs: number | null;
  rafHandle: number;
};

type MirrorBeat = {
  kind: "crash" | "handoff";
  startedAtMs: number;
  rafHandle: number;
  then: (() => void) | null;
};

const BEAT_DURATION_MS: Record<MirrorBeat["kind"], number> = {
  crash: CRASH_BEAT_MS,
  handoff: HANDOFF_BEAT_MS
};

const prefersReducedMotion = (): boolean => {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

const resolveRunKey = (leg: FappyMinigameLeg): string => `${leg.legIndex}:${leg.attempt}`;

// The display re-runs the tablet's attempt from its flap log on a local clock
// that starts when the first flap arrives, a few ticks behind. A flap that
// arrives for a tick the mirror has already drawn re-simulates from the top
// — a few hundred trivial steps — so the picture is always the log's truth,
// never a guess. No clock is synchronised with anything. When the tablet
// moves on (a respawn, the next leg) while the wall is still mid-flight, the
// wall finishes the flight it has, plays the crash or the landing, and only
// then draws what the tablet is on.
export const useFappyMirror = ({ leg, gatesPerLeg, sceneRef }: FappyMirrorInput): void => {
  const runRef = useRef<MirrorRun | null>(null);
  const beatRef = useRef<MirrorBeat | null>(null);
  // Set once the flight in hand has ended with the tablet already elsewhere:
  // the effect below runs again against whatever the tablet is on by then.
  const pendingRef = useRef<(() => void) | null>(null);
  const [settledCount, markSettled] = useReducer((count: number) => count + 1, 0);
  const legIndex = leg?.legIndex ?? null;
  const legSeed = leg?.seed ?? 0;
  const legStatus = leg?.status ?? null;
  const attempt = leg?.attempt ?? 0;
  const checkpointGate = leg?.checkpointGate ?? 0;
  const knockedEagles = useMemo(() => leg?.knockedEagles ?? [], [leg]);
  const knockedEaglesKey = knockedEagles.join(",");
  const isSkipped = leg?.skipped ?? false;
  const flapTicks = useMemo(() => leg?.flapTicks ?? [], [leg]);
  const flapLogKey = flapTicks.join(",");
  const gates = useMemo(() => {
    return legIndex === null
      ? []
      : resolveFappyGates({ seed: legSeed, legIndex, gatesPerLeg });
  }, [legIndex, legSeed, gatesPerLeg]);

  // The loops live on refs and are stopped on purpose — when a new run or a
  // still frame replaces them, or on unmount — never by an effect's cleanup,
  // so a flight the tablet has already moved past can still play out.
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

  const startBeat = (kind: MirrorBeat["kind"], frame: FappyFrame): MirrorBeat => {
    stopBeat();

    const beat: MirrorBeat = { kind, startedAtMs: performance.now(), rafHandle: 0, then: null };
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

    return beat;
  };

  // The flight in hand has ended: play it out, then draw whatever the tablet
  // moved on to in the meantime.
  const settleRun = (run: MirrorRun): void => {
    run.rafHandle = 0;

    const beat = startBeat(run.frame.outcome === "crashed" ? "crash" : "handoff", run.frame);

    beat.then = (): void => {
      const pending = pendingRef.current;

      pendingRef.current = null;
      pending?.();
    };
  };

  const paintStill = (key: string, frame: FappyFrame): void => {
    stopLoop();
    stopBeat();
    runRef.current = { key, gates, gatesPerLeg, flapTicks: [], frame, startedAtMs: null, rafHandle: 0 };
    sceneRef.current?.paint(frame);
  };

  useEffect(() => {
    if (leg === null || legIndex === null || legStatus === null) {
      pendingRef.current = null;
      paintStill("", createFappyLegStart(gates, checkpointGate, knockedEagles));
      return;
    }

    const key = resolveRunKey(leg);
    const course = { seed: legSeed, legIndex, gatesPerLeg };
    const current = runRef.current;

    // The tablet is on a different attempt or leg than the wall. If the wall
    // is still flying the old one, let it land or crash first; if it is
    // playing that out, queue the switch behind the beat.
    if (current !== null && current.key !== key && current.key !== "") {
      const isStillFlying = current.startedAtMs !== null && current.frame.outcome === null;
      const isPlayingOut = beatRef.current !== null;

      if (isStillFlying || isPlayingOut) {
        pendingRef.current = (): void => {
          runRef.current = null;
          markSettled();
        };
        return;
      }
    }

    pendingRef.current = null;

    if (legStatus === "ready") {
      paintStill(key, createFappyLegStart(gates, checkpointGate, knockedEagles));
      return;
    }

    if (legStatus === "cleared" && isSkipped) {
      const landing = createFappyLegLanding(gates, gatesPerLeg, knockedEagles);

      paintStill(key, landing);
      startBeat("handoff", landing);
      return;
    }

    // The flight is the game, not decoration — but a viewer who asked for
    // less motion still gets the landing, just without the flight.
    if (
      legStatus === "cleared" &&
      (prefersReducedMotion() || current === null || current.key !== key || current.startedAtMs === null)
    ) {
      const landing = runFappyLeg(course, flapTicks, checkpointGate, knockedEagles).frame;

      paintStill(key, landing);

      if (!prefersReducedMotion()) {
        startBeat("handoff", landing);
      }

      return;
    }

    // A beat is already playing this attempt out; nothing new to draw.
    if (beatRef.current !== null && current !== null && current.key === key && current.frame.outcome !== null) {
      return;
    }

    const run: MirrorRun =
      current !== null && current.key === key
        ? { ...current, flapTicks }
        : {
            key,
            gates,
            gatesPerLeg,
            flapTicks,
            frame: createFappyLegStart(gates, checkpointGate, knockedEagles),
            startedAtMs: null,
            rafHandle: 0
          };

    stopLoop();
    runRef.current = run;

    if (run.startedAtMs === null) {
      run.startedAtMs = performance.now();
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
      createFappyLegStart(gates, checkpointGate, knockedEagles),
      gates,
      gatesPerLeg,
      run.flapTicks,
      Math.max(run.frame.tick, resolveTargetTick(performance.now()))
    );

    if (run.frame.outcome !== null) {
      settleRun(run);
      return;
    }

    sceneRef.current?.paint(run.frame);

    const step = (now: number): void => {
      run.frame = advanceFappy(run.frame, run.gates, run.gatesPerLeg, run.flapTicks, resolveTargetTick(now));

      if (run.frame.outcome !== null) {
        settleRun(run);
        return;
      }

      sceneRef.current?.paint(run.frame);
      run.rafHandle = window.requestAnimationFrame(step);
    };

    run.rafHandle = window.requestAnimationFrame(step);
  }, [legIndex, legSeed, legStatus, attempt, checkpointGate, knockedEaglesKey, isSkipped, flapLogKey, gates, gatesPerLeg, sceneRef, settledCount]);

  useEffect(() => {
    return (): void => {
      stopLoop();
      stopBeat();
    };
  }, []);
};
