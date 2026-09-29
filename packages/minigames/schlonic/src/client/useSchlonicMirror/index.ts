import { useEffect, useReducer, useRef, type RefObject } from "react";
import type {
  SchlonicBestLeg,
  SchlonicFrame,
  SchlonicInput,
  SchlonicMinigameRun,
  SchlonicZone
} from "@wingnight/shared";
import { SCHLONIC_WORLD, advanceSchlonic, createSchlonicRunStart, runSchlonicRun } from "@wingnight/shared";
import type { SchlonicZoneCourse } from "@wingnight/shared";

import { BANK_COUNT_MS, CLEARED_BEAT_MS, HIT_PAUSE_MS, WIPEOUT_BEAT_MS } from "../beats/index.js";
import { resolveAirPeak, resolveMirrorEvents, type SchlonicMirrorEventHandler } from "../mirrorEvents/index.js";
import { resolveHandfulLost } from "../resolveHandfulLost/index.js";
import { resolveDueCues, resolvePunchlineCues } from "../SchlonicScene/punchlineTimeline/index.js";
import type { SchlonicSceneHandle } from "../SchlonicScene/index.js";
import { paintZoneTrack, type SchlonicTrack } from "../trackMarks/index.js";
import { paintWingTally } from "../wingTally/index.js";

type SchlonicMirrorInput = {
  run: SchlonicMinigameRun | null;
  /** The leg the run is played on, as the zone the sim sees. */
  zone: SchlonicZone;
  /** What laid the zone out, so the referee's own re-run lands on the same leg. */
  course: SchlonicZoneCourse;
  sceneRef: RefObject<SchlonicSceneHandle>;
  /** Where the wings in hand are written each frame: the marquee's tally, outside the scene. */
  tallyRef?: RefObject<HTMLElement>;
  /** The zone strip over the arena, whose live pin the loop moves each frame. */
  trackRef?: RefObject<HTMLElement>;
  /** The whole street the strip draws, and where this leg starts on it, for the pin. */
  track?: SchlonicTrack;
  /** The leg to beat: replayed from its own log on the live run's clock, as the ghost. */
  ghost?: SchlonicBestLeg | null;
  /** The marquee's banked figure, counted up at the post while the in-hand figure counts down. */
  bankRef?: RefObject<HTMLElement>;
  /** What the view says the team has banked — after the post, this run included. */
  wingsBanked?: number;
  /** What the replay announces between frames; STABLE identity, read from a ref. */
  onEvent?: SchlonicMirrorEventHandler;
  /** One wing counted into the bank at the post, with the share counted so far; stable identity. */
  onBankTick?: (share: number) => void;
};

// How far behind the tablet the TV draws, in ticks: a tenth of a second, so a press has normally
// arrived before the mirror reaches the tick it applies to and the runner on the wall does not
// walk into the pit it is about to jump.
const MIRROR_DELAY_TICKS = 6;

type MirrorRun = {
  key: string;
  inputs: readonly SchlonicInput[];
  frame: SchlonicFrame;
  // The ghost's log and frame, fixed when the run is taken up: the run to beat is the one that
  // stood when this run started, whatever the view says by the time it ends.
  ghostInputs: readonly SchlonicInput[] | null;
  ghostFrame: SchlonicFrame | null;
  startedAtMs: number | null;
  rafHandle: number;
};

type MirrorBeat = {
  kind: "cleared" | "wipeout";
  /** Where the ghost stood when the run ended; it holds there through the beat. */
  ghostFrame: SchlonicFrame | null;
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
  course,
  sceneRef,
  tallyRef,
  trackRef,
  track,
  ghost = null,
  bankRef,
  wingsBanked = 0,
  onEvent,
  onBankTick
}: SchlonicMirrorInput): void => {
  const runRef = useRef<MirrorRun | null>(null);
  // Read when a run is taken up, never a dependency: the ghost must not restart the mirror
  // mid-replay. The listeners and the bank are refs for the same reason: the loop's closure
  // must see the current ones without being torn down.
  const ghostRef = useRef(ghost);
  const onEventRef = useRef(onEvent);
  const onBankTickRef = useRef(onBankTick);
  const wingsBankedRef = useRef(wingsBanked);

  ghostRef.current = ghost;
  onEventRef.current = onEvent;
  onBankTickRef.current = onBankTick;
  wingsBankedRef.current = wingsBanked;

  // The view counts a run the moment the server has refereed it; the wall is still replaying
  // that run for a few ticks and then holds the post for a beat, so while it is, the bank is
  // shown WITHOUT that run — the count-up at the post is what puts it in.
  const doneWingsRef = useRef(run?.status === "done" ? (run.result?.wings ?? 0) : 0);

  doneWingsRef.current = run?.status === "done" ? (run.result?.wings ?? 0) : 0;

  const paintBank = (banked: number): void => {
    paintWingTally(bankRef?.current ?? null, Math.max(0, banked));
  };
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
  // The chrome the loop writes outside the scene: the marquee's tallies and the strip's pins.
  // A run still being replayed is not in the bank yet, whatever the view says.
  const paintChrome = (frame: SchlonicFrame, ghostFrame: SchlonicFrame | null = null): void => {
    paintWingTally(tallyRef?.current ?? null, frame.wings);
    paintZoneTrack(trackRef?.current ?? null, track ?? { course: zone, fromX: 0 }, frame, ghostFrame);
    paintBank(wingsBankedRef.current - (frame.outcome === null ? doneWingsRef.current : 0));
  };

  // A fresh mirror run on the line, with the ghost on the line beside it if the round has one.
  const createMirrorRun = (key: string, inputs: readonly SchlonicInput[]): MirrorRun => {
    const best = ghostRef.current;

    return {
      key,
      inputs,
      frame: createSchlonicRunStart(zone),
      ghostInputs: best === null ? null : best.inputs,
      ghostFrame: best === null ? null : createSchlonicRunStart(zone),
      startedAtMs: null,
      rafHandle: 0
    };
  };

  // The ghost keeps pace with the live replay tick for tick; past its own post it stands still.
  const advanceGhost = (mirror: MirrorRun, toTick: number): void => {
    if (mirror.ghostFrame !== null && mirror.ghostInputs !== null) {
      mirror.ghostFrame = advanceSchlonic(mirror.ghostFrame, zone, mirror.ghostInputs, toTick);
    }
  };

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

  const startBeat = (
    kind: MirrorBeat["kind"],
    frame: SchlonicFrame,
    ghostFrame: SchlonicFrame | null,
    inputs: readonly SchlonicInput[]
  ): MirrorBeat => {
    stopBeat();

    const beat: MirrorBeat = {
      kind,
      ghostFrame,
      startedAtMs: performance.now(),
      rafHandle: 0,
      then: null
    };
    // The post's count-up: the handful leaves the bird and lands in the bank one wing at a
    // time, a tick each. `wingsBankedRef` already includes this run — the server refereed it
    // before the wall got here — so the bank starts from what it held before.
    const bankBefore = Math.max(0, wingsBankedRef.current - frame.wings);
    let counted = 0;
    // A run that went wrong plays its punchline, and the wall sounds each part of the joke as
    // the picture reaches it: the thud and the raccoon, or every wing the goose eats.
    const wingsLost = resolveHandfulLost(zone, inputs, frame);
    const punchlineCues =
      frame.outcome === "fell" || frame.outcome === "wiped" ? resolvePunchlineCues(frame.outcome, wingsLost) : [];
    let soundedToMs = -1;
    const paintBeat = (progress: number): void => {
      if (kind === "cleared") {
        sceneRef.current?.paintCleared(frame, progress, ghostFrame);

        const countShare = Math.min(1, (progress * BEAT_DURATION_MS[kind]) / BANK_COUNT_MS);
        const nextCounted = Math.round(frame.wings * countShare);

        if (nextCounted > counted) {
          counted = nextCounted;
          onBankTickRef.current?.(frame.wings === 0 ? 1 : counted / frame.wings);
        }

        paintWingTally(tallyRef?.current ?? null, frame.wings - counted);
        paintBank(bankBefore + counted);
        paintZoneTrack(trackRef?.current ?? null, track ?? { course: zone, fromX: 0 }, frame, ghostFrame);
        return;
      }

      const elapsedMs = progress * BEAT_DURATION_MS[kind];

      sceneRef.current?.paintWipeout(frame, progress, ghostFrame, wingsLost);
      paintChrome(frame, ghostFrame);

      for (const cue of resolveDueCues(punchlineCues, soundedToMs, elapsedMs)) {
        onEventRef.current?.({ kind: cue });
      }

      soundedToMs = elapsedMs;
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

    const beat = startBeat(
      mirror.frame.outcome === "cleared" ? "cleared" : "wipeout",
      mirror.frame,
      mirror.ghostFrame,
      mirror.inputs
    );

    beat.then = (): void => {
      const pending = pendingRef.current;

      pendingRef.current = null;
      pending?.();
    };
  };

  // A still frame is also where a run is first taken up (on the line, `ready`), and the live
  // replay that follows inherits it — so it carries the ghost from the start, or the wall would
  // race nobody.
  const paintStill = (key: string, frame: SchlonicFrame): void => {
    stopLoop();
    stopBeat();
    runRef.current = { ...createMirrorRun(key, []), frame };
    sceneRef.current?.paint(frame);
    paintChrome(frame);
    paintBank(wingsBankedRef.current);
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
      const settled = runSchlonicRun(course, inputs).frame;

      paintStill(key, settled);

      if (!prefersReducedMotion()) {
        // The ghost as far as the settled run's own tick: the beat holds both where they stood.
        const still = runRef.current;

        if (still !== null) {
          advanceGhost(still, settled.tick);
        }

        startBeat(
          settled.outcome === "cleared" ? "cleared" : "wipeout",
          settled,
          still?.ghostFrame ?? null,
          inputs
        );
      }

      return;
    }

    // A beat is already playing this run out; nothing new to draw.
    if (beatRef.current !== null && current !== null && current.key === key) {
      return;
    }

    const mirror: MirrorRun =
      current !== null && current.key === key ? { ...current, inputs } : createMirrorRun(key, inputs);

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

    advanceGhost(mirror, mirror.frame.tick);

    // How much air the runner has had since its feet were last down, so a landing only clacks
    // after a real one (`resolveAirPeak`). A rebuild can start mid-air; it counts from there.
    let airPeak = resolveAirPeak(0, mirror.frame, zone);

    if (mirror.frame.outcome !== null) {
      settleRun(mirror);
      return;
    }

    sceneRef.current?.paint(mirror.frame, mirror.ghostFrame);
    paintChrome(mirror.frame, mirror.ghostFrame);

    const step = (now: number): void => {
      const targetTick = resolveTargetTick(now);
      const previous = mirror.frame;

      mirror.frame = advanceSchlonic(mirror.frame, zone, mirror.inputs, targetTick);
      advanceGhost(mirror, mirror.frame.tick);

      const events = resolveMirrorEvents(previous, mirror.frame, zone, airPeak);

      airPeak = resolveAirPeak(airPeak, mirror.frame, zone);

      for (const event of events) {
        // A hit stops the wall's clock for a beat and jolts the picture, the same pause the
        // tablet takes, so the two stay a fixed few ticks apart.
        if (event.kind === "hit") {
          mirror.startedAtMs = (mirror.startedAtMs ?? now) + HIT_PAUSE_MS;
          sceneRef.current?.shake();
        }

        onEventRef.current?.(event);
      }

      if (mirror.frame.outcome !== null) {
        settleRun(mirror);
        return;
      }

      sceneRef.current?.paint(mirror.frame, mirror.ghostFrame);
      paintChrome(mirror.frame, mirror.ghostFrame);
      mirror.rafHandle = window.requestAnimationFrame(step);
    };

    mirror.rafHandle = window.requestAnimationFrame(step);
  }, [runIndex, runStatus, isSkipped, inputLogKey, zone, course, track, sceneRef, tallyRef, trackRef, settledCount]);

  useEffect(() => {
    return (): void => {
      stopLoop();
      stopBeat();
    };
  }, []);
};
