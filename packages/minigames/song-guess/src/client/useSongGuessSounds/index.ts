import { useEffect, useRef } from "react";
import { useHouseSoundboard } from "@wingnight/surface";
import type { SongGuessMinigameDisplayView } from "@wingnight/shared";

type SongGuessPhase = SongGuessMinigameDisplayView["phase"];

// Pure: the needle coming off the record. Only a clip that was playing scratches when the host
// pauses it for the lock-in; a pause the display mounts on, or a reveal, says nothing.
export const resolveClipCue = (
  previousPhase: SongGuessPhase | null | undefined,
  phase: SongGuessPhase | null
): "scratch" | null => {
  return previousPhase === "clip_playing" && phase === "clip_paused" ? "scratch" : null;
};

// The room's sound for a song, on the TV only, and only the scratch: the clip is the music, and
// the ruling is the house result card's own sting.
export const useSongGuessSounds = (view: SongGuessMinigameDisplayView | null): void => {
  const play = useHouseSoundboard();
  const phase = view?.phase ?? null;
  const previousPhaseRef = useRef<SongGuessPhase | null | undefined>(undefined);

  useEffect(() => {
    const cue = resolveClipCue(previousPhaseRef.current, phase);

    previousPhaseRef.current = phase;

    if (cue !== null) {
      play(cue);
    }
  }, [phase, play]);
};
