// The TV clock's two sounds, synthesised here and now: a tick for each of the
// last ten seconds and a buzzer at zero. It is the display's board — the TV is
// the room's speaker, the host tablet is barely audible on a table — and only
// `useMinigameClockSound` ever plays it.
//
// It follows FAPPY's soundboard (`packages/minigames/fappy/src/client/audio`),
// not the host's chime: ONE AudioContext for the whole module, made on the
// first cue and never closed. The host's `useTimesUpChime` makes and closes a
// context per beep, which is fine for one chime an hour on a tablet and wrong
// on the TV, where the lobby's beat clock has already learned that closing a
// context can mute the room. Nothing here touches the display's `<audio>`
// element either: a media element can be tapped once for its lifetime and the
// beat clock holds that tap.
//
// Every cue is best-effort. No `AudioContext`, one the room has not unlocked
// yet (the display's `AudioUnlockOverlay` tap is what resumes it), a context
// that refuses to start under a headless Playwright run: all of them are
// SILENCE, never an exception, and the next cue tries again. Nothing on this
// board may break the picture.

export type ClockCueName = "tick" | "timesUp";

// Sits under the party music rather than over it, but a tick a second has to
// read across a room, so a notch above FAPPY's board.
export const CLOCK_MASTER_GAIN = 0.3;

// The shortest gap between two soundings of the same cue. A guard, not a rate
// limiter: two renders landing on one second must be one tick, and a buzzer
// that fired must not fire again for the same zero.
export const CLOCK_CUE_MIN_GAP_MS: Record<ClockCueName, number> = {
  tick: 250,
  timesUp: 1500
};

export const isClockCueDue = (
  lastPlayedAtMs: number | null,
  nowMs: number,
  minGapMs: number
): boolean => lastPlayedAtMs === null || nowMs - lastPlayedAtMs >= minGapMs;

type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export type ClockAudioContextFactory = () => AudioContext | null;

let sharedContext: AudioContext | null = null;

const resolveSharedContext: ClockAudioContextFactory = () => {
  if (sharedContext !== null) {
    return sharedContext;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextConstructor =
    window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext;

  if (AudioContextConstructor === undefined) {
    return null;
  }

  try {
    sharedContext = new AudioContextConstructor();
  } catch {
    return null;
  }

  return sharedContext;
};

const masters = new WeakMap<AudioContext, GainNode>();

const resolveMaster = (context: AudioContext): GainNode => {
  const existing = masters.get(context);

  if (existing !== undefined) {
    return existing;
  }

  const master = context.createGain();

  master.gain.setValueAtTime(CLOCK_MASTER_GAIN, context.currentTime);
  master.connect(context.destination);
  masters.set(context, master);

  return master;
};

// Envelopes are exponential ramps, so they need a floor above zero.
const SILENCE = 0.0001;
const RELEASE_SECONDS = 0.02;

type ToneSpec = {
  startAt: number;
  durationSeconds: number;
  type: OscillatorType;
  fromHz: number;
  toHz?: number;
  peak: number;
  attackSeconds?: number;
};

const playTone = (context: AudioContext, master: GainNode, spec: ToneSpec): void => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const stopAt = spec.startAt + spec.durationSeconds;
  const peakAt = spec.startAt + Math.min(spec.attackSeconds ?? 0.005, spec.durationSeconds * 0.8);

  oscillator.type = spec.type;
  oscillator.frequency.setValueAtTime(spec.fromHz, spec.startAt);

  if (spec.toHz !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, spec.toHz), stopAt);
  }

  gain.gain.setValueAtTime(SILENCE, spec.startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, spec.peak), peakAt);
  gain.gain.exponentialRampToValueAtTime(SILENCE, stopAt);

  oscillator.connect(gain);
  gain.connect(master);
  oscillator.start(spec.startAt);
  oscillator.stop(stopAt + RELEASE_SECONDS);
};

type CueVoice = (context: AudioContext, master: GainNode, startAt: number) => void;

// One voice per cue; the numbers are a table to retune, not a system.
const CUE_VOICES: Record<ClockCueName, CueVoice> = {
  // A woodblock: a bright click over a short low knock, gone in 90 ms. Ten of
  // these in a row have to read as a countdown, never as an alarm.
  tick: (context, master, startAt) => {
    playTone(context, master, {
      startAt,
      durationSeconds: 0.05,
      type: "square",
      fromHz: 1400,
      toHz: 900,
      peak: 0.4
    });
    playTone(context, master, {
      startAt,
      durationSeconds: 0.09,
      type: "sine",
      fromHz: 420,
      toHz: 300,
      peak: 0.55
    });
  },
  // A game-show buzzer, and nothing like the tick: two saws a few hertz apart
  // beating against each other over a low square, seven hundred milliseconds
  // of it. Distinct from the host tablet's three-note chime on purpose — the
  // room hears the buzzer, the host hears the chime, and neither is the other.
  timesUp: (context, master, startAt) => {
    playTone(context, master, {
      startAt,
      durationSeconds: 0.7,
      type: "sawtooth",
      fromHz: 165,
      peak: 0.5,
      attackSeconds: 0.02
    });
    playTone(context, master, {
      startAt,
      durationSeconds: 0.7,
      type: "sawtooth",
      fromHz: 168,
      peak: 0.5,
      attackSeconds: 0.02
    });
    playTone(context, master, {
      startAt,
      durationSeconds: 0.7,
      type: "square",
      fromHz: 82,
      peak: 0.3,
      attackSeconds: 0.02
    });
  }
};

export type ClockSoundboard = {
  // Sound a cue now. Never throws: a missing, blocked or still-suspended
  // context is silence, and the next cue tries again.
  play: (cue: ClockCueName) => void;
};

export type ClockSoundboardOptions = {
  // Injected in tests; the AudioContext itself is not unit-testable.
  createContext?: ClockAudioContextFactory;
  now?: () => number;
};

export const createClockSoundboard = (
  options: ClockSoundboardOptions = {}
): ClockSoundboard => {
  const createContext = options.createContext ?? resolveSharedContext;
  const now = options.now ?? ((): number => Date.now());
  const lastPlayedAtMs = new Map<ClockCueName, number>();

  const play = (cue: ClockCueName): void => {
    try {
      const atMs = now();

      if (!isClockCueDue(lastPlayedAtMs.get(cue) ?? null, atMs, CLOCK_CUE_MIN_GAP_MS[cue])) {
        return;
      }

      const context = createContext();

      if (context === null) {
        return;
      }

      // Resume on every cue, not once: the room taps the display's unlock
      // overlay at some point we are not told about, and a tab that goes to
      // the background suspends again.
      if (context.state !== "running") {
        void Promise.resolve(context.resume()).catch(() => undefined);

        // Still not running. Scheduling into a suspended context would queue
        // the cue and dump the backlog at once when it wakes, so drop it: the
        // next tick is a second away and tries again.
        return;
      }

      lastPlayedAtMs.set(cue, atMs);
      // A hair in the future, because a node started exactly at `currentTime` can click.
      CUE_VOICES[cue](context, resolveMaster(context), context.currentTime + 0.002);
    } catch {
      // Best-effort: audio must never break the stage or a headless test run.
    }
  };

  return { play };
};
