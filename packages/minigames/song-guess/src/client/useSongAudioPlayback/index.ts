import type { SongGuessMinigameDisplayView } from "@wingnight/shared";
import { useEffect, useRef, type RefObject } from "react";

import { resolveSongAudioSrc } from "../resolveSongAudioSrc/index.js";
import {
  hasReachedClipEnd,
  resolveSongPlaybackIntent,
  type SongPlaybackSnapshot
} from "../resolveSongPlaybackIntent/index.js";

export const resolvePlaybackSnapshot = (
  view: SongGuessMinigameDisplayView
): SongPlaybackSnapshot => {
  return {
    phase: view.phase,
    songCursor: view.songCursor,
    replayUsed: view.replayUsed,
    clipStartSeconds: "clip" in view ? view.clip.clipStart : null,
    revealStartSeconds:
      "reveal" in view && view.reveal !== null ? view.reveal.revealStart : null
  };
};

// While the host is still ruling the view carries neither block, and the
// element keeps the clip it already has: the src effect leaves a `null` alone.
export const resolveAudioFileName = (
  view: SongGuessMinigameDisplayView
): string | null => {
  if ("clip" in view) {
    return view.clip.audioFileName;
  }

  if ("reveal" in view && view.reveal !== null) {
    return view.reveal.audioFileName;
  }

  return null;
};

const resolveClipEndSeconds = (
  view: SongGuessMinigameDisplayView | null
): number | null => {
  return view !== null && "clip" in view ? view.clip.clipEnd : null;
};

// Every media call is best-effort, mirroring `useTeamAnthemCue`: a rejected
// play(), a blocked autoplay policy or a missing MP3 must never throw and never
// stall the round.
const playQuietly = (media: HTMLAudioElement, seekToSeconds: number | null): void => {
  try {
    if (seekToSeconds !== null) {
      media.currentTime = seekToSeconds;
    }

    void media.play().catch(() => {
      // Autoplay policy, or the host never dropped the MP3 in. Silent round.
    });
  } catch {
    // Some engines throw synchronously rather than rejecting.
  }
};

const pauseQuietly = (media: HTMLAudioElement): void => {
  try {
    media.pause();
  } catch {
    // Best-effort; a detached element must not break the phase advance.
  }
};

type UseSongAudioPlaybackProps = {
  view: SongGuessMinigameDisplayView | null;
  serverOrigin: string | null;
  mediaRef: RefObject<HTMLAudioElement | null>;
};

export const useSongAudioPlayback = ({
  view,
  serverOrigin,
  mediaRef
}: UseSongAudioPlaybackProps): void => {
  const previousSnapshotRef = useRef<SongPlaybackSnapshot | null>(null);
  const audioFileName = view === null ? null : resolveAudioFileName(view);
  const clipEndSeconds = resolveClipEndSeconds(view);

  // Setting the src is deliberately separate from playing it, so an e2e can
  // assert the TV pointed at the right file without first tapping the unlock
  // overlay.
  useEffect(() => {
    const media = mediaRef.current;

    if (media === null || audioFileName === null || serverOrigin === null) {
      return;
    }

    const nextSrc = resolveSongAudioSrc(audioFileName, serverOrigin);

    if (media.getAttribute("src") !== nextSrc) {
      media.setAttribute("src", nextSrc);
    }
  }, [audioFileName, serverOrigin, mediaRef]);

  useEffect(() => {
    const media = mediaRef.current;

    if (media === null || view === null) {
      return;
    }

    const snapshot = resolvePlaybackSnapshot(view);
    const intent = resolveSongPlaybackIntent(previousSnapshotRef.current, snapshot);
    previousSnapshotRef.current = snapshot;

    if (intent.kind === "play") {
      playQuietly(media, intent.seekToSeconds);
      return;
    }

    if (intent.kind === "pause") {
      pauseQuietly(media);
    }
  }, [view, mediaRef]);

  // The clip is a window into a full-length track, so it is stopped on the
  // clock rather than by the file running out.
  useEffect(() => {
    const media = mediaRef.current;

    if (media === null || clipEndSeconds === null) {
      return undefined;
    }

    const handleTimeUpdate = (): void => {
      if (hasReachedClipEnd(media.currentTime, clipEndSeconds)) {
        pauseQuietly(media);
      }
    };

    media.addEventListener("timeupdate", handleTimeUpdate);

    return (): void => {
      media.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [clipEndSeconds, mediaRef]);
};
