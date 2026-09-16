import type { SongGuessPhase } from "@wingnight/shared";

// What the TV's audio element should do on this render. Derived as a PURE
// function of the previous and current view rather than inside the effect,
// because effect bodies are unobservable under this repo's client harness
// (`tsx --test`, no DOM) — the same split `useTeamAnthemCue` uses.
export type SongPlaybackIntent =
  | { kind: "play"; seekToSeconds: number | null }
  | { kind: "pause" }
  | { kind: "none" };

export type SongPlaybackSnapshot = {
  phase: SongGuessPhase;
  songCursor: number;
  replayUsed: boolean;
  clipStartSeconds: number | null;
  revealStartSeconds: number | null;
};

const NO_INTENT: SongPlaybackIntent = { kind: "none" };

export const resolveSongPlaybackIntent = (
  previous: SongPlaybackSnapshot | null,
  current: SongPlaybackSnapshot
): SongPlaybackIntent => {
  const isNewSong = previous === null || previous.songCursor !== current.songCursor;

  if (current.phase === "reveal") {
    // Re-entering reveal is the only thing that restarts the cover; a re-render
    // while already revealed must not jump the track back.
    if (!isNewSong && previous?.phase === "reveal") {
      return NO_INTENT;
    }

    return { kind: "play", seekToSeconds: current.revealStartSeconds };
  }

  if (current.phase === "clip_playing") {
    if (!isNewSong && previous?.phase === "clip_playing") {
      return NO_INTENT;
    }

    // Play from `idle` starts the clip; play from `clip_paused` RESUMES where
    // the host stopped it. Restarting from the top is what Replay is for, and
    // that is the move the once-per-song rule caps — so a resume must not
    // quietly hand out a second listen.
    const shouldRestart =
      isNewSong ||
      previous === null ||
      previous.phase === "idle" ||
      (current.replayUsed && !previous.replayUsed);

    return {
      kind: "play",
      seekToSeconds: shouldRestart ? current.clipStartSeconds : null
    };
  }

  if (!isNewSong && previous?.phase === current.phase) {
    return NO_INTENT;
  }

  return { kind: "pause" };
};

// The clip is a window into a longer track, so playback is stopped on a
// timeupdate rather than by the file ending.
export const hasReachedClipEnd = (
  currentTimeSeconds: number,
  clipEndSeconds: number | null
): boolean => {
  return clipEndSeconds !== null && currentTimeSeconds >= clipEndSeconds;
};
