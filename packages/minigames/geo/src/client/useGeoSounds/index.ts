import { useEffect, useRef } from "react";
import { useHouseSoundboard } from "@wingnight/surface";
import type { GeoMinigameDisplayView } from "@wingnight/shared";

// Pure: whether a change in the team's live pin is a drop worth a plop. `undefined` is the
// reading before the first: a display that mounts on a pin already down says nothing about it.
// The pin lifting (a new photo clears it) is silent too; only a pin landing somewhere new plops.
export const resolvePinCue = (
  previousPinKey: string | null | undefined,
  pinKey: string | null
): "plop" | null => {
  if (previousPinKey === undefined || pinKey === null || pinKey === previousPinKey) {
    return null;
  }

  return "plop";
};

// The room's sound for a guess, on the TV only: a plop each time the team's pin lands on the
// theatre map. The reveal is the house result card's own sting.
export const useGeoSounds = (view: GeoMinigameDisplayView | null): void => {
  const play = useHouseSoundboard();
  const guess = view?.status === "guessing" ? view.currentGuess : null;
  const pinKey = guess === null ? null : `${guess.lat},${guess.lng}`;
  const previousPinKeyRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const cue = resolvePinCue(previousPinKeyRef.current, pinKey);

    previousPinKeyRef.current = pinKey;

    if (cue !== null) {
      play(cue);
    }
  }, [pinKey, play]);
};
