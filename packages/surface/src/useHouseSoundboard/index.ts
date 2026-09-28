import { createHouseSoundboard, type HouseCueName, type HouseSoundboard } from "@wingnight/audio";
import { useCallback, useRef } from "react";

export type PlayHouseCue = (cue: HouseCueName, intensity?: number) => void;

// A stable `play` for the house cues, with the board made on the first cue
// rather than on mount — a surface that is only ever looked at never asks the
// browser for an audio context at all. Every display surface that borrows a
// house sound goes through this rather than holding its own ref and board.
export const useHouseSoundboard = (): PlayHouseCue => {
  const boardRef = useRef<HouseSoundboard | null>(null);

  return useCallback((cue: HouseCueName, intensity?: number): void => {
    boardRef.current ??= createHouseSoundboard();
    boardRef.current.play(cue, intensity);
  }, []);
};
