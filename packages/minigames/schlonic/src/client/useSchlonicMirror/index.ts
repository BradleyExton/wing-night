import { useEffect, useReducer, useRef, type RefObject } from "react";
import type { SchlonicFrame, SchlonicInput, SchlonicMinigameRun, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, advanceSchlonic, createSchlonicRunStart, runSchlonicRun } from "@wingnight/shared";

import { CLEARED_BEAT_MS, WIPEOUT_BEAT_MS } from "../beats/index.js";
import type { SchlonicSceneHandle } from "../SchlonicScene/index.js";

type SchlonicMirrorInput = {
  run: SchlonicMinigameRun | null;
  zone: SchlonicZone;
  zoneSeed: number;
  zoneChunks: number;
  sceneRef: RefObject<SchlonicSceneHandle>;
};

// How far behind the tablet the TV draws, in ticks: a tenth of a second, so a press has normally
// arrived before the mirror reaches the tick it applies to and the runner on the wall does not
// walk into the pit it is about to jump.
const MIRROR_DELAY_TICKS = 6;

type MirrorRun = {
  key: string;
  inputs: readonly SchlonicInput[];
  frame: SchlonicFrame;
  startedAtMs: number | null;
  rafHandle: number;
};

type MirrorBeat = {
  kind: "cleared" | "wipeout";
  startedAtMs: number;
  rafHandle: number;
  then: (() => void) | null;
};

const BEAT_DURATION_MS: Record<MirrorBeat["kind"], number> = {
  cleared: CLEARED_BEAT_MS,
  wipeout: WIPEOUT_BEAT_MS
};

const prefersReducedMotion = (): boolean => {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

/**
 * The display re-runs the tablet's run from its input log on a local clock that starts when the
 * first press arrives, a few ticks behind. An event that arrives for a tick the mirror has
 * already drawn re-simulates from the top — a few hundred trivial steps — so the picture is
 * always the log's truth, never a guess. No clock is synchronised with anything. When the tablet
 * moves on while the wall is still mid-run, the wall finishes the run it has, plays how it
 * ended, and only then draws what the tablet is on.
 */
export const useSchlonicMirror = ({
  run,
  zone,
  zoneSeed,
  zoneChunks,
  sceneRef
}: SchlonicMirrorInput): void => {
  const runRef = useRef<MirrorRun | null>(null);
  const beatRef = useRef<MirrorBeat | null>(null);
  // Set once the run in hand has ended with the tablet already elsewhere: the effect below runs
  // again against whatever the tablet is on by then.
  const pendingRef = useRef<(() => void) | null>(null);
  const [settledCount, markSettled] = useReducer((count: number) => count + 1, 0);
  const runIndex = run?.runIndex ?? null;
  const runStatus = run?.status ?? null;
  const isSkipped = run?.skipped ?? false;
  const inputs = run?.inputs ?? [];
  const inputLogKey = inputs.map((input) => `${input.tick}${input.down ? "d" : "u"}`).join(",");

  // The loops live on refs and are stopped on purpose — when a new run or a still frame replaces
  // them, or on unmount — never by an effect's cleanup, so a run the tablet has already moved
  // past can still play out.
  const stopLoop = (): void => {
    const mirror = runRef.current;

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

  const startBeat = (kind: MirrorBeat["kind"], frame: SchlonicFrame): MirrorBeat => {
    stopBeat();

    const beat: MirrorBeat = { kind, startedAtMs: performance.now(), rafHandle: 0, then: null };
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

    return beat;
  };

  const settleRun = (mirror: MirrorRun): void => {
    mirror.rafHandle = 0;

    const beat = startBeat(mirror.frame.outcome === "cleared" ? "cleared" : "wipeout", mirror.frame);

    beat.then = (): void => {
      const pending = pendingRef.current;

      pendingRef.current = null;
      pending?.();
    };
  };

  const paintStill = (key: string, frame: SchlonicFrame): void => {
    stopLoop();
    stopBeat();
    runRef.current = { key, inputs: [], frame, startedAtMs: null, rafHandle: 0 };
    sceneRef.current?.paint(frame);
  };

  useEffect(() => {
    if (run === null || runIndex === null || runStatus === null) {
      pendingRef.current = null;
      paintStill("", createSchlonicRunStart(zone));
      return;
    }

    const key = `${runIndex}`;
    const current = runRef.current;

    // The tablet is on a different run than the wall. If the wall is still running the old one,
    // let it end first; if it is playing that out, queue the switch behind the beat.
    if (current !== null && current.key !== key && current.key !== "") {
      const isStillRunning = current.startedAtMs !== null && current.frame.outcome === null;

      if (isStillRunning || beatRef.current !== null) {
        pendingRef.current = (): void => {
          runRef.current = null;
          markSettled();
        };
        return;
      }
    }

    pendingRef.current = null;

    if (runStatus === "ready") {
      paintStill(key, createSchlonicRunStart(zone));
      return;
    }

    if (runStatus === "done" && isSkipped) {
      paintStill(key, createSchlonicRunStart(zone));
      return;
    }

    // The run is the game, not decoration — but a viewer who asked for less motion still gets
    // how it ended, just without the running.
    if (
      runStatus === "done" &&
      (prefersReducedMotion() || current === null || current.key !== key || current.startedAtMs === null)
    ) {
      const settled = runSchlonicRun({ seed: zoneSeed, chunks: zoneChunks }, inputs).frame;

      paintStill(key, settled);

      if (!prefersReducedMotion()) {
        startBeat(settled.outcome === "cleared" ? "cleared" : "wipeout", settled);
      }

      return;
    }

    // A beat is already playing this run out; nothing new to draw.
    if (beatRef.current !== null && current !== null && current.key === key) {
      return;
    }

    const mirror: MirrorRun =
      current !== null && current.key === key
        ? { ...current, inputs }
        : { key, inputs, frame: createSchlonicRunStart(zone), startedAtMs: null, rafHandle: 0 };

    stopLoop();
    runRef.current = mirror;

    if (mirror.startedAtMs === null) {
      mirror.startedAtMs = performance.now();
    }

    const resolveTargetTick = (now: number): number => {
      return Math.max(
        0,
        Math.floor(((now - (mirror.startedAtMs ?? now)) * SCHLONIC_WORLD.tickHz) / 1000) -
          MIRROR_DELAY_TICKS
      );
    };

    // The log changed under a running mirror: rebuild the frame from the top with the log as it
    // now is, up to where the clock says we are.
    mirror.frame = advanceSchlonic(
      createSchlonicRunStart(zone),
      zone,
      mirror.inputs,
      Math.max(mirror.frame.tick, resolveTargetTick(performance.now()))
    );

    if (mirror.frame.outcome !== null) {
      settleRun(mirror);
      return;
    }

    sceneRef.current?.paint(mirror.frame);

    const step = (now: number): void => {
      mirror.frame = advanceSchlonic(mirror.frame, zone, mirror.inputs, resolveTargetTick(now));

      if (mirror.frame.outcome !== null) {
        settleRun(mirror);
        return;
      }

      sceneRef.current?.paint(mirror.frame);
      mirror.rafHandle = window.requestAnimationFrame(step);
    };

    mirror.rafHandle = window.requestAnimationFrame(step);
  }, [runIndex, runStatus, isSkipped, inputLogKey, zone, zoneSeed, zoneChunks, sceneRef, settledCount]);

  useEffect(() => {
    return (): void => {
      stopLoop();
      stopBeat();
    };
  }, []);
};
