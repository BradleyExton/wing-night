import type { Soundboard } from "@wingnight/audio";
import { useCallback, useEffect, useRef } from "react";

import { useSfxTakes, type SfxTakeUrls } from "../useSfxTakes/index.js";

// A game's board factory (`createFappySoundboard` and its kin): called bare for a
// board of synthesis, and with the pack's takes once they land.
export type GameSoundboardFactory<Cue extends string> = (options?: {
  takes: SfxTakeUrls;
}) => Soundboard<Cue>;

export type PlayGameCue<Cue extends string> = (cue: Cue, intensity?: number) => void;

export type GameSoundboardSlot<Cue extends string> = {
  play: PlayGameCue<Cue>;
  // A board per take listing, made as the takes land so they have decoded
  // before the first cue. With none, the board waits for the first cue.
  setTakes: (takes: SfxTakeUrls) => void;
};

// Pure: the one board a surface holds, made on the first cue rather than on
// mount, so a surface that is only ever looked at never asks the browser for an
// audio context at all.
export const createGameSoundboardSlot = <Cue extends string>(
  createBoard: GameSoundboardFactory<Cue>
): GameSoundboardSlot<Cue> => {
  let board: Soundboard<Cue> | null = null;

  return {
    play: (cue, intensity): void => {
      board ??= createBoard();
      board.play(cue, intensity);
    },
    setTakes: (takes): void => {
      board = Object.keys(takes).length === 0 ? null : createBoard({ takes });
    }
  };
};

export type GameSoundboardInput<Cue extends string> = {
  // Read once, on the first render: pass the game's module-level factory.
  createBoard: GameSoundboardFactory<Cue>;
  // The game's take listing (`resolveSfxTakesUrl(folder, serverOrigin)`), or
  // null for synthesis only.
  takesUrl: string | null;
  // False on a tablet with a TV beside it: the TV is the room's speaker, so the
  // tablet asks for no takes and plays nothing. True on the TV, and on a
  // surface playing solo. A game that gates by mounting (JOUST's `SoloSpeaker`)
  // leaves it at the default.
  isSpeaker?: boolean;
};

// A stable `play` for a game's cue table. The identity holds for the life of
// the surface, deliberately: a mirror's rAF loop closes over the handlers it
// was set up with, and a `play` that changed per render would go stale in the
// loop and fall silent mid-run. It reads the board and the speaker flag through
// refs, so the swap to a board with takes changes nothing a caller holds.
export const useGameSoundboard = <Cue extends string>({
  createBoard,
  takesUrl,
  isSpeaker = true
}: GameSoundboardInput<Cue>): PlayGameCue<Cue> => {
  const takes = useSfxTakes(isSpeaker ? takesUrl : null);
  const slotRef = useRef<GameSoundboardSlot<Cue> | null>(null);
  const isSpeakerRef = useRef(isSpeaker);

  slotRef.current ??= createGameSoundboardSlot(createBoard);
  isSpeakerRef.current = isSpeaker;

  useEffect(() => {
    slotRef.current?.setTakes(takes);
  }, [takes]);

  return useCallback((cue: Cue, intensity?: number): void => {
    if (!isSpeakerRef.current) {
      return;
    }

    slotRef.current?.play(cue, intensity);
  }, []);
};
