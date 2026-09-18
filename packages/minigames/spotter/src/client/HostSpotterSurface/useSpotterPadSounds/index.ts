import { useEffect, useRef } from "react";

type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type SpotterPadSounds = {
  playTick: () => void;
  playThunk: () => void;
};

// Eyes-free confirmation for the holder: a short tick per registered nudge
// and a lower thunk on fire. The host tablet's first tap is the user gesture
// that unlocks audio, so no unlock overlay is needed. Every call is
// best-effort — a blocked or missing AudioContext must never break the pad.
export const useSpotterPadSounds = (): SpotterPadSounds => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return (): void => {
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const resolveAudioContext = (): AudioContext | null => {
    if (typeof window === "undefined") {
      return null;
    }

    if (audioContextRef.current !== null) {
      return audioContextRef.current;
    }

    const AudioContextConstructor =
      window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext;

    if (AudioContextConstructor === undefined) {
      return null;
    }

    try {
      audioContextRef.current = new AudioContextConstructor();
    } catch {
      return null;
    }

    return audioContextRef.current;
  };

  const playTone = (frequencyHz: number, durationSeconds: number, type: OscillatorType): void => {
    const audioContext = resolveAudioContext();

    if (audioContext === null) {
      return;
    }

    try {
      void audioContext.resume();

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const startAt = audioContext.currentTime;
      const stopAt = startAt + durationSeconds;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequencyHz, startAt);
      gain.gain.setValueAtTime(0.1, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, stopAt);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(stopAt);
    } catch {
      // Best-effort only.
    }
  };

  return {
    playTick: (): void => {
      playTone(1320, 0.06, "square");
    },
    playThunk: (): void => {
      playTone(180, 0.22, "triangle");
    }
  };
};
