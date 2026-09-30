import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

import { attachAnalyser } from "../../DisplayBoard/useBeatClock";

// iOS Safari 16.4+: without "playback" the ringer's silent switch mutes Web Audio, and a tapped
// element plays only through Web Audio — so a phone on silent would show the pill lit and play
// nothing. Absent everywhere else, and harmless there.
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

type TeaserLobbyMusic = {
  mediaRef: MutableRefObject<HTMLAudioElement | null>;
  // Once true, the beat clock reads the song rather than keeping its own time.
  isTapped: boolean;
  isPlaying: boolean;
  toggle: () => void;
};

// The landing's one song, started and stopped by a tap: a phone plays nothing a page did not
// ask for inside a gesture, so there is no autoplay to attempt. The first tap also taps the
// element for the beat clock (`attachAnalyser`), in the gesture, so the parade dances to it.
export const useTeaserLobbyMusic = (): TeaserLobbyMusic => {
  const mediaRef = useRef<HTMLAudioElement | null>(null);
  const [isTapped, setIsTapped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // The element's own events, not the tap, decide the pill: a phone call or another tab's audio
  // can pause the song with no tap here.
  useEffect(() => {
    const media = mediaRef.current;

    if (media === null) {
      return undefined;
    }

    const syncPlaying = (): void => {
      setIsPlaying(!media.paused);
    };

    media.addEventListener("play", syncPlaying);
    media.addEventListener("pause", syncPlaying);

    return (): void => {
      media.removeEventListener("play", syncPlaying);
      media.removeEventListener("pause", syncPlaying);
    };
  }, []);

  const toggle = useCallback(() => {
    const media = mediaRef.current;

    if (media === null) {
      return;
    }

    if (!media.paused) {
      media.pause();
      return;
    }

    if (!isTapped) {
      const audioSession = (navigator as AudioSessionNavigator).audioSession;

      if (audioSession !== undefined) {
        audioSession.type = "playback";
      }

      attachAnalyser(media);
      setIsTapped(true);
    }

    void media.play().catch(() => {
      // A missing file or a refused play: the element never fires `play`, so the pill stays off.
    });
  }, [isTapped]);

  return { mediaRef, isTapped, isPlaying, toggle };
};
