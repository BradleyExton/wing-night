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
  // `null` through the whole of the reveal phase until the host has ruled on
  // both halves: the view withholds the reveal, and this withholds the cover.
  revealStartSeconds: number | null;
};

const NO_INTENT: SongPlaybackIntent = { kind: "none" };

export const resolveSongPlaybackIntent = (
  previous: SongPlaybackSnapshot | null,
  current: SongPlaybackSnapshot
): SongPlaybackIntent => {
  const isNewSong = previous === null || previous.songCursor !== current.songCursor;

  if (current.phase === "reveal") {
    // The original plays with the card, not before it: while the host is still
    // ruling the view carries no reveal, and the clip stays paused where the
    // host stopped it. A `play` with no seek here would RESUME the cover mid-
    // clip, which is the second listen the replay rule caps.
    if (current.revealStartSeconds === null) {
      return !isNewSong && previous?.phase === "reveal" ? NO_INTENT : { kind: "pause" };
    }

    // The ruling completing is the only thing that starts the original; a
    // re-render while the card is up — the host changing a verdict — must not
    // jump the track back.
    if (
      !isNewSong &&
      previous?.phase === "reveal" &&
      previous.revealStartSeconds !== null
    ) {
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
