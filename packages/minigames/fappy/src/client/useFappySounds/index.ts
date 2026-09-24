import { useCallback, useEffect, useRef } from "react";
import type { FappyMinigameDisplayView, FappyPhase } from "@wingnight/shared";

import {
  createFappySoundboard,
  resolveClockCue,
  type FappyCueName,
  type FappySoundboard
} from "../audio/index.js";
import type { FappyMirrorEvent, FappyMirrorEventHandler } from "../mirrorEvents/index.js";
import type { LegHold } from "../useHeldLeg/index.js";

/**
 * Which cue each thing the mirror replays makes. A bumping eagle and a landing glob are the
 * same shove to the sim and the same squelch to the room, so they share a voice.
 *
 * `landed` rings the handoff, and so does the surface's leg hold below — the same moment told
 * twice, a beat apart, because neither one covers every case: the mirror never flies a skipped
 * leg or a reduced-motion landing, and the hold never fires on the relay's last leg. The
 * soundboard's per-cue gap collapses the pair into one ding when both do fire.
 */
const MIRROR_EVENT_CUES: Record<FappyMirrorEvent, FappyCueName> = {
  flap: "flap",
  gateCleared: "gateCleared",
  eagleBumped: "bump",
  splat: "bump",
  crashed: "crash",
  landed: "handoff"
};

type FappySoundsInput = {
  view: FappyMinigameDisplayView;
  hold: LegHold | null;
  /** The relay clock's running time, or null before the first flap. */
  elapsedMs: number | null;
};

/**
 * The room's sound for one team's relay, on the TV only.
 *
 * Returns the handler to hand `useFappyMirror` as its `onEvent`. That handler's identity is
 * STABLE for the life of the surface, deliberately: the mirror's effect carries a
 * hand-narrowed dependency array so that a rAF loop is never torn down mid-flight, which means
 * its rAF closure holds whatever handler it was set up with. A handler that changed identity
 * per render would go stale in the loop and the corridor would fall silent mid-leg.
 *
 * Nothing sounds before the relay's first flap (which is also what sets `startedAtMs`), so the
 * intro and a team still reading the briefing are silent by construction.
 */
export const useFappySounds = ({ view, hold, elapsedMs }: FappySoundsInput): FappyMirrorEventHandler => {
  // Made on the first cue rather than on mount, so a surface that is only ever looked at
  // never asks the browser for an audio context at all.
  const boardRef = useRef<FappySoundboard | null>(null);
  const play = useCallback((cue: FappyCueName, intensity?: number): void => {
    boardRef.current ??= createFappySoundboard();
    boardRef.current.play(cue, intensity);
  }, []);

  // Read by the stable mirror handler, so it always sees the current relay rather than the one
  // that was current when the mirror's effect last ran.
  const hasStartedRef = useRef(false);

  useEffect(() => {
    hasStartedRef.current = view.startedAtMs !== null;
  }, [view.startedAtMs]);

  const handleMirrorEvent = useCallback(
    (event: FappyMirrorEvent): void => {
      if (!hasStartedRef.current) {
        return;
      }

      play(MIRROR_EVENT_CUES[event]);
    },
    [play]
  );

  // The relay ending, once. A surface that mounts already finished (a reconnect, a rehydrate)
  // has no previous phase to have left, so it stays quiet.
  const phase = view.phase;
  const previousPhaseRef = useRef<FappyPhase | null>(null);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;

    previousPhaseRef.current = phase;

    if (previousPhase === null || previousPhase === phase) {
      return;
    }

    if (phase === "finished") {
      play("finish");
    } else if (phase === "timedOut") {
      play("timedOut");
    }
  }, [phase, play]);

  // The tablet changing hands. Keyed on the hold itself so a second handoff rings again.
  const holdKind = hold?.kind ?? null;
  const holdKey = hold === null ? "" : `${hold.legIndex}:${hold.startedAtMs}`;

  useEffect(() => {
    if (holdKind !== "handoff") {
      return;
    }

    play("handoff");
  }, [holdKind, holdKey, play]);

  // The clock. `useRelayClock` moves `elapsedMs` every tenth of a second; the cue changes at
  // most once a second, so this effect fires on the second and not on the readout.
  const isOver = phase === "finished" || phase === "timedOut";
  const clockCue =
    elapsedMs === null || isOver
      ? null
      : resolveClockCue({
          elapsedMs,
          parSeconds: view.parSeconds,
          limitSeconds: view.limitSeconds
        });
  const clockCueName = clockCue?.cue ?? null;
  const clockCueSecond = clockCue?.second ?? -1;
  const urgency = clockCue?.urgency ?? 0;

  useEffect(() => {
    if (clockCueName === null) {
      return;
    }

    // `urgency` is deliberately not a dependency: the effect must fire on the second, not
    // every time the swell nudges, and an effect body already reads this render's value.
    play(clockCueName, urgency);
  }, [clockCueName, clockCueSecond, play]);

  return handleMirrorEvent;
};
