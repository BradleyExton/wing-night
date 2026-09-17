import { Phase } from "@wingnight/shared";
import { useEffect, useRef, type RefObject } from "react";

import { playQuietly, stopQuietly } from "../displayMediaPlayback";
import { resolveAnthemForRound } from "../../../utils/resolveAnthemForRound";
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

type UseTeamAnthemCueProps = {
  phase: Phase | null;
  anthems: string[] | null;
  currentRound: number | null;
  audioUnlocked: boolean;
  mediaRef: RefObject<HTMLAudioElement | null>;
};

export const useTeamAnthemCue = ({
  phase,
  anthems,
  currentRound,
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
  // Which cue currently owns the shared `<audio>` element. See the stop branch.
  const anthemPlayingRef = useRef(false);
  // Rotation lives in a pure selector rather than inline here, for the same
  // reason the phase predicates above do: an effect body is unobservable under
  // `tsx --test`, so anything worth pinning has to be testable outside one.
  const roundAnthem = resolveAnthemForRound(anthems, currentRound);

  // Setting the src is deliberately separate from playing it: the src is set
  // whenever an anthem is available, independent of unlock state, so the e2e can
  // assert on it without tapping the overlay first. `resolveServerOrigin` reads
  // `window`, so it is called HERE (in an effect) and never at render scope —
  // react-dom/server never runs effects.
  useEffect(() => {
    const media = mediaRef.current;

    if (media === null || roundAnthem === null || phase === Phase.SETUP) {
      return;
    }

    try {
      const nextSrc = resolveAnthemSrc(roundAnthem, resolveServerOrigin());

      if (media.getAttribute("src") !== nextSrc) {
        media.setAttribute("src", nextSrc);
      }
    } catch {
      // A missing origin must not break the display.
    }
  }, [roundAnthem, phase, mediaRef]);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    previousPhaseRef.current = phase;

    const media = mediaRef.current;

    if (media === null) {
      return;
    }

    if (shouldStopTeamAnthem(phase)) {
      cuePendingRef.current = false;

      // Only ever stops what THIS cue started. The element is shared with the
      // lobby playlist, which owns it at SETUP — an unconditional pause here
      // would silence the lobby music on every re-render of the setup screen,
      // most visibly at the moment the unlock tap flips `audioUnlocked`.
      if (anthemPlayingRef.current) {
        anthemPlayingRef.current = false;
        stopQuietly(media);
      }

      return;
    }

    if (shouldStartTeamAnthem(previousPhase, phase, roundAnthem !== null)) {
      cuePendingRef.current = true;
    }

    if (cuePendingRef.current && audioUnlocked) {
      cuePendingRef.current = false;
      anthemPlayingRef.current = true;
      playQuietly(media);
    }
  }, [phase, roundAnthem, audioUnlocked, mediaRef]);
};
