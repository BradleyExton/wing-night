import { useEffect, useRef } from "react";

type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const CHIME_NOTES = [
  { frequencyHz: 880, startAtSeconds: 0 },
  { frequencyHz: 660, startAtSeconds: 0.2 },
  { frequencyHz: 880, startAtSeconds: 0.4 }
] as const;

const NOTE_DURATION_SECONDS = 0.18;

const playChime = (): void => {
  const AudioContextConstructor =
    window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext;

  if (AudioContextConstructor === undefined) {
    return;
  }

  try {
    const audioContext = new AudioContextConstructor();
    void audioContext.resume();

    for (const note of CHIME_NOTES) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const startAt = audioContext.currentTime + note.startAtSeconds;
      const stopAt = startAt + NOTE_DURATION_SECONDS;

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(note.frequencyHz, startAt);
      gain.gain.setValueAtTime(0.08, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, stopAt);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(stopAt);
    }

    window.setTimeout(() => {
      void audioContext.close();
    }, 1500);
  } catch {
    // Audio is best-effort; a blocked or missing AudioContext must never
    // break host controls.
  }
};

// Beeps once on the host tablet the moment a running countdown crosses zero.
export const useTimesUpChime = (remainingSeconds: number | null): void => {
  const previousRemainingRef = useRef<number | null>(null);

  useEffect(() => {
    const previousRemaining = previousRemainingRef.current;
    previousRemainingRef.current = remainingSeconds;

    if (remainingSeconds === null || remainingSeconds > 0) {
      return;
    }

    if (previousRemaining === null || previousRemaining <= 0) {
      return;
    }

    playChime();
  }, [remainingSeconds]);
};
