import {
  MUSIC_PLAYBACK_SOURCES,
  type MusicPlaybackSource,
  type RoomMusicPlaybackState
} from "@wingnight/shared";
import { useEffect, useRef, type RefObject } from "react";

import { pauseQuietly, playQuietly, stopQuietly } from "../displayMediaPlayback";
import {
  buildMusicPositionKey,
  forgetMusicPosition,
  readMusicPosition,
  rememberMusicPosition,
  resolveResumeSeconds
} from "../musicPositionMemory";
import {
  createVolumeRamp,
  FADE_IN_MS,
  FADE_OUT_MS,
  type VolumeRamp
} from "../musicVolumeRamp";
import { resolveMusicTrackSrc } from "../../../utils/resolveMusicTrackSrc";
import { resolveServerOrigin } from "../../../utils/resolveServerOrigin";

// The display's ONE music cue, and the only claimant on its `<audio>` element.
// It replaced two cues — `useLobbyPlaylistCue` and `useTeamAnthemCue` — that
// each decided for themselves what should be playing and coexisted only because
// their phases were disjoint. That arrangement could not survive host control:
// once "pause" and "skip" are mutations, what is playing is room state, and a
// cue that derives it from `phase` is deciding something the server already
// decided. So this hook decides NOTHING about what plays. It renders
// `musicPlayback`.
//
// What it does own is the transition between two of the server's decisions:
// the fade-out before a track stops or is swapped, the fade-in when one starts,
// and where in the file a returning track picks up (`musicPositionMemory`).
// Those are the speaker's manners, not the room's state.
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

// Whether the speaker needs a fade-out before the next state is applied: only
// when something is audibly playing AND the next state either silences it or
// swaps the file under it. A silent element (before the unlock tap, or already
// paused) swaps and stops instantly, which is what keeps the e2e's "src is set
// before the tap" contract intact.
export const shouldFadeOutFirst = (
  isAudible: boolean,
  isTrackChanging: boolean,
  wantsPlay: boolean
): boolean => {
  return isAudible && (isTrackChanging || !wantsPlay);
};

// Whether the element itself should repeat the track it is on.
//
// Only ever the lobby, and only when it is the playlist's one track. A
// multi-track playlist advances through the server — the display reports the
// track ended, the server moves its cursor, the next snapshot names the next
// file — which is what keeps a refresh, a second display and a host skip
// agreeing about where the playlist is. A ONE-track playlist has nowhere to
// advance to: the server's cursor wraps to the track it is already on, which
// is not a change, so no snapshot arrives and nothing restarts the element.
// The lobby played once and the room went quiet. `loop` is the repeat that
// needs no round trip.
//
// An anthem is never looped however short the team's list, because it is a
// one-shot cue: it ends, the server marks it not playing, and the room is
// quiet until the next phase.
export const shouldLoopTrack = (
  musicPlayback: RoomMusicPlaybackState | null
): boolean => {
  return (
    musicPlayback !== null &&
    musicPlayback.source === MUSIC_PLAYBACK_SOURCES.LOBBY &&
    musicPlayback.trackCount <= 1
  );
};

// A resume from a host pause keeps the element's own position; only a track
// starting from (near) the top consults the memory.
export const shouldSeekToRememberedPosition = (currentTimeSeconds: number): boolean => {
  return currentTimeSeconds < 0.5;
};

// The mirror rule for writing: a position at the very top of the track says
// nothing about where it got to and would only overwrite a real one.
export const shouldRememberPosition = (currentTimeSeconds: number): boolean => {
  return currentTimeSeconds >= 0.5;
};

const POSITION_WRITE_INTERVAL_MS = 2000;

type LoadedTrack = {
  source: MusicPlaybackSource;
  trackFileName: string;
};

type UseMusicPlaybackCueProps = {
  musicPlayback: RoomMusicPlaybackState | null;
  // The room's master volume on the element's own 0–1 scale. Fades ramp
  // towards it, and a nudge outside a fade applies directly, so a host moving
  // the slider never reloads or restarts a track.
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
  const isPlaying = musicPlayback?.isPlaying ?? false;
  const isLoopingTrack = shouldLoopTrack(musicPlayback);

  const masterVolumeRef = useRef(musicVolume);
  const rampRef = useRef<VolumeRamp | null>(null);
  const loadedTrackRef = useRef<LoadedTrack | null>(null);
  const lastPositionWriteRef = useRef(0);

  const cancelRamp = (): void => {
    rampRef.current?.cancel();
    rampRef.current = null;
  };

  // Writes only a position worth keeping. An element parked at 0 — the
  // pre-unlock stop, the tap's own rewind — would otherwise overwrite the
  // memory this exists to hold; a finished track has already been forgotten.
  const rememberLoadedPosition = (media: HTMLAudioElement): void => {
    const loaded = loadedTrackRef.current;

    if (loaded === null || media.ended || !shouldRememberPosition(media.currentTime)) {
      return;
    }

    rememberMusicPosition(
      buildMusicPositionKey(loaded.source, loaded.trackFileName),
      media.currentTime
    );
  };

  useEffect(() => {
    masterVolumeRef.current = musicVolume;
    const media = mediaRef.current;

    // Mid-fade, the ramp reads the master on every tick and follows it.
    if (media === null || rampRef.current !== null) {
      return;
    }

    try {
      media.volume = musicVolume;
    } catch {
      // An engine that owns its own volume (iOS) throws or ignores; either way
      // the track still plays, which is the part the party needs.
    }
  }, [mediaRef, musicVolume]);

  // Kept in its own effect rather than folded into the transition below, so it
  // cannot disturb that effect's guarded `src` assignment — and so it re-applies
  // on a playlist that grows or shrinks under a content reload, which changes
  // `trackCount` without touching the track being played.
  useEffect(() => {
    const media = mediaRef.current;

    if (media === null) {
      return;
    }

    media.loop = isLoopingTrack;
  }, [isLoopingTrack, mediaRef]);

  // The server owns the cursor, so a finished track is REPORTED rather than
  // acted on: the display says which track ended and waits to be told what
  // plays next. That round trip is what keeps a refresh, a second display and
  // a host skip from disagreeing about where the playlist is. A finished track
  // also forgets its position: next time it plays from the top.
  //
  // Keyed on the TRACK, not the ref: the element is rendered only once the
  // snapshot names a music source, so an effect that ran once at mount would
  // attach to nothing. Position memory rides the same listener set, throttled
  // so the element's ~4 Hz `timeupdate` is not 4 storage writes a second, and
  // the cleanup — which runs before the next track's effect swaps the src, and
  // on unmount — keeps whatever the outgoing track got to.
  useEffect(() => {
    const media = mediaRef.current;

    if (media === null || source === null || trackIndex === null || trackFileName === null) {
      return;
    }

    const handleTrackEnded = (): void => {
      forgetMusicPosition(buildMusicPositionKey(source, trackFileName));
      onTrackEnded?.(source, trackIndex);
    };

    const handleTimeUpdate = (): void => {
      const now = Date.now();

      if (media.paused || now - lastPositionWriteRef.current < POSITION_WRITE_INTERVAL_MS) {
        return;
      }

      lastPositionWriteRef.current = now;
      rememberLoadedPosition(media);
    };

    // A refresh or a closed tab never runs React's cleanups, so the position is
    // flushed on `pagehide` too — otherwise a refresh resumes up to
    // `POSITION_WRITE_INTERVAL_MS` behind where it actually was.
    const handlePageHide = (): void => {
      rememberLoadedPosition(media);
    };

    media.addEventListener("ended", handleTrackEnded);
    media.addEventListener("timeupdate", handleTimeUpdate);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      media.removeEventListener("ended", handleTrackEnded);
      media.removeEventListener("timeupdate", handleTimeUpdate);
      window.removeEventListener("pagehide", handlePageHide);
      rememberLoadedPosition(media);
    };
    // `rememberLoadedPosition` reads refs only.
  }, [mediaRef, onTrackEnded, source, trackFileName, trackIndex]);

  // The one transition effect. It computes the state the server wants, decides
  // (via the pure predicates above) whether the speaker needs a fade first, and
  // applies. `resolveServerOrigin` reads `window`, so it is called HERE (in an
  // effect) and never at render scope — react-dom/server never runs effects.
  useEffect(() => {
    const media = mediaRef.current;

    if (media === null) {
      return;
    }

    let desiredSrc: string | null = null;

    if (source !== null && trackFileName !== null) {
      try {
        desiredSrc = resolveMusicTrackSrc(source, trackFileName, resolveServerOrigin());
      } catch {
        // A missing origin must not break the display.
      }
    }

    const wantsPlay = shouldPlayMusic(musicPlayback, audioUnlocked);
    const wantsHold = shouldHoldMusicPosition(musicPlayback);
    const isTrackChanging =
      desiredSrc !== null && media.getAttribute("src") !== desiredSrc;

    const seekToRememberedPosition = (track: LoadedTrack): void => {
      const remembered = readMusicPosition(
        buildMusicPositionKey(track.source, track.trackFileName)
      );
      const resumeAt = resolveResumeSeconds(remembered, media.duration);

      if (resumeAt <= 0) {
        return;
      }

      try {
        media.currentTime = resumeAt;
      } catch {
        // No metadata yet on some engines; the `loadedmetadata` listener in
        // `applyTarget` gets a second chance.
      }
    };

    const applyTarget = (): void => {
      if (isTrackChanging && desiredSrc !== null && source !== null && trackFileName !== null) {
        rememberLoadedPosition(media);
        // Guarded, because assigning `src` reloads the element from the top —
        // which is right on a track change and wrong on every re-render.
        media.setAttribute("src", desiredSrc);
        const track: LoadedTrack = { source, trackFileName };
        loadedTrackRef.current = track;
        seekToRememberedPosition(track);
        media.addEventListener(
          "loadedmetadata",
          () => {
            if (shouldSeekToRememberedPosition(media.currentTime)) {
              seekToRememberedPosition(track);
            }
          },
          { once: true }
        );
      }

      if (wantsPlay) {
        const loaded = loadedTrackRef.current;

        if (
          media.paused &&
          loaded !== null &&
          shouldSeekToRememberedPosition(media.currentTime)
        ) {
          seekToRememberedPosition(loaded);
        }

        try {
          media.volume = 0;
        } catch {
          // See the master-volume effect.
        }

        playQuietly(media);
        rampRef.current = createVolumeRamp(
          media,
          () => masterVolumeRef.current,
          FADE_IN_MS,
          () => {
            rampRef.current = null;
          }
        );
        return;
      }

      rememberLoadedPosition(media);

      if (wantsHold) {
        pauseQuietly(media);
        return;
      }

      // Either the phase owns no music or the room has not been tapped yet.
      // Rewinding the element is right in both cases: the memory above is
      // what carries the position, not the element.
      stopQuietly(media);
    };

    cancelRamp();

    const isAudible = !media.paused && media.volume > 0 && audioUnlocked;

    if (!shouldFadeOutFirst(isAudible, isTrackChanging, wantsPlay)) {
      applyTarget();

      // A fade-in may be running; unmount or the next decision cancels it.
      return () => {
        cancelRamp();
      };
    }

    rememberLoadedPosition(media);
    rampRef.current = createVolumeRamp(media, () => 0, FADE_OUT_MS, () => {
      rampRef.current = null;
      applyTarget();
    });

    // A newer decision cancels a fade in flight; the newer effect run applies
    // its own target from wherever the volume got to.
    return () => {
      cancelRamp();
    };
    // `musicPlayback` is covered by the four scalars pulled off it above;
    // `rememberLoadedPosition`/`cancelRamp` read refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaRef, source, trackFileName, trackIndex, isPlaying, audioUnlocked]);
};
