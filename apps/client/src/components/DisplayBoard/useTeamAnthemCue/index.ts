import { Phase } from "@wingnight/shared";
import { useEffect, useRef, type RefObject } from "react";

import { resolveAnthemSrc } from "../../../utils/resolveAnthemSrc";
import { resolveServerOrigin } from "../../../utils/resolveServerOrigin";

// The phase-diff decision lives OUT here, in pure predicates, rather than inside
// the effect: client tests run under `tsx --test` with no DOM, and
// `renderDisplayMarkup` is react-dom/server, so an effect body is unobservable
// by any harness in this repo. Same shape as `useGameStartCountdown`, whose
// colocated test drives its two predicates directly.

// Entry only — `previousPhase !== MINIGAME_INTRO` is what stops a re-render at
// MINIGAME_INTRO from re-firing the cue.
export const shouldStartTeamAnthem = (
  previousPhase: Phase | null,
  currentPhase: Phase | null,
  hasAnthems: boolean
): boolean => {
  return (
    previousPhase !== Phase.MINIGAME_INTRO &&
    currentPhase === Phase.MINIGAME_INTRO &&
    hasAnthems
  );
};

export const shouldStopTeamAnthem = (currentPhase: Phase | null): boolean => {
  return currentPhase !== Phase.MINIGAME_INTRO;
};

// Every media call is best-effort, mirroring `useTimesUpChime`: a rejected
// play(), a blocked autoplay policy or a 404 anthem must never throw and never
// block a phase advance.
const playQuietly = (media: HTMLAudioElement): void => {
  try {
    void media.play().catch(() => {
      // Autoplay policy, or a missing file. Not our problem to surface.
    });
  } catch {
    // Some engines throw synchronously rather than rejecting.
  }
};

const stopQuietly = (media: HTMLAudioElement): void => {
  try {
    media.pause();
    media.currentTime = 0;
  } catch {
    // Best-effort; a detached element must not break the phase advance.
  }
};

type UseTeamAnthemCueProps = {
  phase: Phase | null;
  anthems: string[] | null;
  audioUnlocked: boolean;
  mediaRef: RefObject<HTMLAudioElement | null>;
};

export const useTeamAnthemCue = ({
  phase,
  anthems,
  audioUnlocked,
  mediaRef
}: UseTeamAnthemCueProps): void => {
  const previousPhaseRef = useRef<Phase | null>(phase);
  // Armed on entry, disarmed once the cue actually plays (or once the phase
  // leaves). This is what makes the cue fire exactly once per entry while STILL
  // firing when the unlock tap lands after entry — without it the very first
  // MINIGAME_INTRO of the night would be silent, since `audioUnlocked` is false
  // at the moment of entry.
  const cuePendingRef = useRef(false);
  const firstAnthem = anthems?.[0] ?? null;

  // Setting the src is deliberately separate from playing it: the src is set
  // whenever an anthem is available, independent of unlock state, so the e2e can
  // assert on it without tapping the overlay first. `resolveServerOrigin` reads
  // `window`, so it is called HERE (in an effect) and never at render scope —
  // react-dom/server never runs effects.
  useEffect(() => {
    const media = mediaRef.current;

    if (media === null || firstAnthem === null) {
      return;
    }

    try {
      const nextSrc = resolveAnthemSrc(firstAnthem, resolveServerOrigin());

      if (media.getAttribute("src") !== nextSrc) {
        media.setAttribute("src", nextSrc);
      }
    } catch {
      // A missing origin must not break the display.
    }
  }, [firstAnthem, mediaRef]);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    previousPhaseRef.current = phase;

    const media = mediaRef.current;

    if (media === null) {
      return;
    }

    if (shouldStopTeamAnthem(phase)) {
      cuePendingRef.current = false;
      stopQuietly(media);
      return;
    }

    if (shouldStartTeamAnthem(previousPhase, phase, firstAnthem !== null)) {
      cuePendingRef.current = true;
    }

    if (cuePendingRef.current && audioUnlocked) {
      cuePendingRef.current = false;
      playQuietly(media);
    }
  }, [phase, firstAnthem, audioUnlocked, mediaRef]);
};
