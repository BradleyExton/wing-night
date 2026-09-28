import { useCallback, useEffect, useRef } from "react";
import type { SchlonicMinigameDisplayView } from "@wingnight/shared";

import { WING_CHIME_TOP_AT, createSchlonicSoundboard, type SchlonicSoundboard } from "../audio/index.js";
import type { SchlonicMirrorEventHandler } from "../mirrorEvents/index.js";
import type { RunHold } from "../useHeldRun/index.js";

type SchlonicSoundsInput = {
  view: SchlonicMinigameDisplayView;
  hold: RunHold | null;
};

export type SchlonicSounds = {
  /** Hand to the mirror as its `onEvent`; stable for the life of the surface. */
  onMirrorEvent: SchlonicMirrorEventHandler;
  /** Hand to the mirror as its `onBankTick`: one wing counted into the bank at the post. */
  onBankTick: (share: number) => void;
};

/**
 * The room's sound for one team's zone, on the TV only. The handlers' identities are STABLE
 * for the life of the surface, deliberately: the mirror's effect carries a hand-narrowed
 * dependency array so a rAF loop is never torn down mid-run, which means its closure holds
 * whatever handlers it was set up with.
 */
export const useSchlonicSounds = ({ view, hold }: SchlonicSoundsInput): SchlonicSounds => {
  // Made on the first cue rather than on mount, so a surface that is only ever looked at
  // never asks the browser for an audio context at all.
  const boardRef = useRef<SchlonicSoundboard | null>(null);
  const play = useCallback((cue: Parameters<SchlonicSoundboard["play"]>[0], intensity?: number): void => {
    boardRef.current ??= createSchlonicSoundboard();
    boardRef.current.play(cue, intensity);
  }, []);

  const onMirrorEvent = useCallback<SchlonicMirrorEventHandler>(
    (event): void => {
      if (event.kind === "wing") {
        play("wing", Math.min(1, event.wingsInHand / WING_CHIME_TOP_AT));
        return;
      }

      if (event.kind === "cleared") {
        play("post");
        return;
      }

      if (event.kind === "finale") {
        play("riser");
        return;
      }

      play(event.kind);
    },
    [play]
  );

  const onBankTick = useCallback(
    (share: number): void => {
      play("bankTick", share);
    },
    [play]
  );

  // The tablet changing hands. Keyed on the hold itself so a second handoff rings again.
  const holdKind = hold?.kind ?? null;
  const holdKey = hold === null ? "" : `${hold.runIndex}:${hold.startedAtMs}`;

  useEffect(() => {
    if (holdKind === "handoff") {
      play("handoff");
    }
  }, [holdKind, holdKey, play]);

  // The team through, once. A surface that mounts already finished (a reconnect) has no
  // previous phase to have left, so it stays quiet.
  const phase = view.phase;
  const previousPhaseRef = useRef<typeof phase | null>(null);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;

    previousPhaseRef.current = phase;

    if (previousPhase !== null && previousPhase !== phase && phase === "finished") {
      play("finish");
    }
  }, [phase, play]);

  return { onMirrorEvent, onBankTick };
};
