import { useCallback, useEffect, useRef } from "react";
import { resolveSfxTakesUrl, type SchlonicMinigameDisplayView } from "@wingnight/shared";
import { useSfxTakes } from "@wingnight/surface";

import {
  SCHLONIC_SFX_FOLDER,
  WING_CHIME_TOP_AT,
  createSchlonicSoundboard,
  resolveSchlonicTakes,
  type SchlonicSoundboard
} from "../audio/index.js";
import type { SchlonicMirrorEventHandler } from "../mirrorEvents/index.js";
import { resolveCardDelayMs, type RunHold } from "../useHeldRun/index.js";

type SchlonicSoundsInput = {
  view: SchlonicMinigameDisplayView;
  hold: RunHold | null;
  serverOrigin: string | null;
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
export const useSchlonicSounds = ({ view, hold, serverOrigin }: SchlonicSoundsInput): SchlonicSounds => {
  const takes = useSfxTakes(resolveSfxTakesUrl(SCHLONIC_SFX_FOLDER, serverOrigin));
  // Made on the first cue rather than on mount, so a surface that is only ever looked at
  // never asks the browser for an audio context at all.
  const boardRef = useRef<SchlonicSoundboard | null>(null);
  const play = useCallback((cue: Parameters<SchlonicSoundboard["play"]>[0], intensity?: number): void => {
    boardRef.current ??= createSchlonicSoundboard();
    boardRef.current.play(cue, intensity);
  }, []);

  // A board per take listing, made as the takes land so they have decoded before the first cue.
  // With none, the board waits for the first cue as before. `play` reads the ref, so the
  // handlers keep their identity across the swap.
  useEffect(() => {
    const boardTakes = resolveSchlonicTakes(takes);

    boardRef.current = Object.keys(boardTakes).length === 0 ? null : createSchlonicSoundboard({ takes: boardTakes });
  }, [takes]);

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

      if (event.kind === "grindStart") {
        play("grindOn");
        return;
      }

      if (event.kind === "grindStop") {
        play("grindOff");
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

  // The tablet changing hands, rung as the card that says so goes up — after the punchline,
  // when there is one. Keyed on the hold itself so a second handoff rings again.
  const holdKind = hold?.kind ?? null;
  const holdKey = hold === null ? "" : `${hold.runIndex}:${hold.startedAtMs}`;
  const cardDelayMs = hold === null ? 0 : resolveCardDelayMs(hold);

  useEffect(() => {
    if (holdKind !== "handoff") {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      play("handoff");
    }, cardDelayMs);

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [holdKind, holdKey, cardDelayMs, play]);

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
