import type { MusicPlaybackSource, RoomMusicPlaybackState } from "@wingnight/shared";
import { useEffect, type RefObject } from "react";

import { pauseQuietly, playQuietly, stopQuietly } from "../displayMediaPlayback";
import { resolveMusicTrackSrc } from "../../../utils/resolveMusicTrackSrc";
import { resolveServerOrigin } from "../../../utils/resolveServerOrigin";

// The display's ONE music cue, and the only claimant on its `<audio>` element.
// It replaced two cues — `useLobbyPlaylistCue` and `useTeamAnthemCue` — that
// each decided for themselves what should be playing and coexisted only because
// their phases were disjoint. That arrangement could not survive host control:
// once "pause" and "skip" are mutations, what is playing is room state, and a
// cue that derives it from `phase` is deciding something the server already
// decided. So this hook decides NOTHING. It renders `musicPlayback`.
//
// The decisions that remain live out here in pure predicates rather than inside
// the effects, because client tests run under `tsx --test` with no DOM and an
// effect body is unobservable by any harness in this repo.

export const shouldPlayMusic = (
  musicPlayback: RoomMusicPlaybackState | null,
  audioUnlocked: boolean
): boolean => {
  return musicPlayback !== null && musicPlayback.isPlaying && audioUnlocked;
};

// A pause holds position; anything else rewinds. Distinguishing the two is why
// `displayMediaPlayback` carries both `pauseQuietly` and `stopQuietly`.
export const shouldHoldMusicPosition = (
  musicPlayback: RoomMusicPlaybackState | null
): boolean => {
  return musicPlayback !== null && !musicPlayback.isPlaying;
};

type UseMusicPlaybackCueProps = {
  musicPlayback: RoomMusicPlaybackState | null;
  // The room's master volume on the element's own 0–1 scale. Applied on its
  // own effect so a host nudging the slider never reloads or restarts a track.
  musicVolume: number;
  audioUnlocked: boolean;
  mediaRef: RefObject<HTMLAudioElement | null>;
  onTrackEnded?: (source: MusicPlaybackSource, trackIndex: number) => void;
};

export const useMusicPlaybackCue = ({
  musicPlayback,
  musicVolume,
  audioUnlocked,
  mediaRef,
  onTrackEnded
}: UseMusicPlaybackCueProps): void => {
  const source = musicPlayback?.source ?? null;
  const trackFileName = musicPlayback?.trackFileName ?? null;
  const trackIndex = musicPlayback?.trackIndex ?? null;

  // Setting the src is deliberately separate from playing it, as it was in the
  // anthem cue: the src is set whenever a track is named, independent of unlock
  // state, so the e2e can assert on it without tapping the overlay first.
  // `resolveServerOrigin` reads `window`, so it is called HERE (in an effect)
  // and never at render scope — react-dom/server never runs effects.
  useEffect(() => {
    const media = mediaRef.current;

    if (media === null || source === null || trackFileName === null) {
      return;
    }

    try {
      const nextSrc = resolveMusicTrackSrc(
        source,
        trackFileName,
        resolveServerOrigin()
      );

      // Guarded, because assigning `src` reloads the element from the top —
      // which is right on a track change and wrong on every re-render.
      if (media.getAttribute("src") !== nextSrc) {
        media.setAttribute("src", nextSrc);
      }
    } catch {
      // A missing origin must not break the display.
    }
  }, [mediaRef, source, trackFileName]);

  useEffect(() => {
    const media = mediaRef.current;

    if (media === null) {
      return;
    }

    try {
      media.volume = musicVolume;
    } catch {
      // An engine that owns its own volume (iOS) throws or ignores; either way
      // the track still plays, which is the part the party needs.
    }
  }, [mediaRef, musicVolume]);

  // The server owns the cursor, so a finished track is REPORTED rather than
  // acted on: the display says which track ended and waits to be told what
  // plays next. That round trip is what keeps a refresh, a second display and
  // a host skip from disagreeing about where the playlist is.
  useEffect(() => {
    const media = mediaRef.current;

    if (
      media === null ||
      onTrackEnded === undefined ||
      source === null ||
      trackIndex === null
    ) {
      return;
    }

    const handleTrackEnded = (): void => {
      onTrackEnded(source, trackIndex);
    };

    media.addEventListener("ended", handleTrackEnded);

    return () => {
      media.removeEventListener("ended", handleTrackEnded);
    };
  }, [mediaRef, onTrackEnded, source, trackIndex]);

  useEffect(() => {
    const media = mediaRef.current;

    if (media === null) {
      return;
    }

    if (shouldPlayMusic(musicPlayback, audioUnlocked)) {
      playQuietly(media);
      return;
    }

    if (shouldHoldMusicPosition(musicPlayback)) {
      pauseQuietly(media);
      return;
    }

    // Either the phase owns no music or the room has not been tapped yet.
    // Rewinding is right in both cases: there is no position worth keeping.
    stopQuietly(media);
  }, [mediaRef, musicPlayback, audioUnlocked]);
};
