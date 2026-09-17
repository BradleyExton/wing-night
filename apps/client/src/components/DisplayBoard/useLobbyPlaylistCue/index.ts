import { Phase } from "@wingnight/shared";
import { useEffect, useState, type RefObject } from "react";

import { playQuietly, stopQuietly } from "../displayMediaPlayback";
import { resolveLobbyTrackSrc } from "../../../utils/resolveLobbyTrackSrc";
import { resolveServerOrigin } from "../../../utils/resolveServerOrigin";

// Same shape as `useTeamAnthemCue`: the decisions live out here in pure
// predicates rather than inside the effects, because client tests run under
// `tsx --test` with no DOM and an effect body is unobservable by any harness in
// this repo.

// SETUP only. Everything from INTRO onward belongs to the game's own moments —
// the round intro, the anthem, the chime — and a bed playing under them is a
// worse party than silence.
export const shouldPlayLobbyPlaylist = (
  phase: Phase | null,
  hasTracks: boolean
): boolean => {
  return phase === Phase.SETUP && hasTracks;
};

// Sequential and wrapping, never shuffled: two displays (or one display and a
// refresh) landing on the same track is the same determinism rule the anthem
// rotation follows.
export const resolveNextLobbyTrackIndex = (
  currentIndex: number,
  trackCount: number
): number => {
  if (trackCount <= 0) {
    return 0;
  }

  return (currentIndex + 1) % trackCount;
};

type UseLobbyPlaylistCueProps = {
  phase: Phase | null;
  lobbyPlaylist: string[];
  audioUnlocked: boolean;
  mediaRef: RefObject<HTMLAudioElement | null>;
};

export const useLobbyPlaylistCue = ({
  phase,
  lobbyPlaylist,
  audioUnlocked,
  mediaRef
}: UseLobbyPlaylistCueProps): void => {
  const [trackIndex, setTrackIndex] = useState(0);
  const trackCount = lobbyPlaylist.length;
  const shouldPlay = shouldPlayLobbyPlaylist(phase, trackCount > 0);
  const currentTrack = shouldPlay
    ? (lobbyPlaylist[trackIndex % trackCount] ?? null)
    : null;

  // Advancing on `ended` rather than on a timer is what makes this a playlist
  // instead of a scheduler: the element tells us when a track is over, so a
  // slow-loading file simply plays late rather than being cut off.
  useEffect(() => {
    const media = mediaRef.current;

    if (media === null || !shouldPlay) {
      return;
    }

    const handleTrackEnded = (): void => {
      setTrackIndex((previousIndex) =>
        resolveNextLobbyTrackIndex(previousIndex, trackCount)
      );
    };

    media.addEventListener("ended", handleTrackEnded);

    return () => {
      media.removeEventListener("ended", handleTrackEnded);
    };
  }, [mediaRef, shouldPlay, trackCount]);

  useEffect(() => {
    const media = mediaRef.current;

    if (media === null) {
      return;
    }

    // Leaving SETUP hands the element back. The pause is unconditional here
    // (unlike the anthem's, which only stops what it started) because the only
    // thing this cue can ever have left playing is its own track: the anthem
    // does not exist at SETUP, and nothing else shares the element at SETUP.
    if (!shouldPlay || currentTrack === null) {
      stopQuietly(media);
      setTrackIndex(0);
      return;
    }

    try {
      const nextSrc = resolveLobbyTrackSrc(currentTrack, resolveServerOrigin());

      if (media.getAttribute("src") !== nextSrc) {
        media.setAttribute("src", nextSrc);
      }
    } catch {
      // A missing origin must not break the display.
    }

    // Gated on the unlock tap, like the anthem: until someone has touched the
    // TV, the autoplay policy rejects every play() we make. Once unlocked, this
    // effect re-runs and the music starts where the room already is.
    if (audioUnlocked) {
      playQuietly(media);
    }
  }, [mediaRef, shouldPlay, currentTrack, audioUnlocked]);
};
