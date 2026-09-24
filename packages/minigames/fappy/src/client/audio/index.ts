/**
 * FAPPY's soundboard: every noise the corridor makes, synthesised here and now.
 *
 * There are no audio files. The whole board is oscillators, one buffer of noise and gain
 * envelopes, because a party pack must not carry a megabyte of sound effects and this machine
 * has no MP3 encoder to make them with anyway.
 *
 * It is the TV's board, not the tablet's: the display is the room's speaker (the host tablet
 * sits on a table and is barely audible), so only `DisplayFappySurface` ever wires it up.
 *
 * ONE AudioContext for the whole package, made on the first cue and kept for good. The house's
 * other synthesised cue (`useTimesUpChime`) makes and closes a context per beep, which is fine
 * for one chime an hour and wrong for a game that flaps ten times a second: contexts are a
 * scarce per-tab resource and each one costs a hardware stream. Nothing here ever closes it —
 * the lobby's beat clock learned that the hard way.
 *
 * Every cue is best-effort. A browser with no `AudioContext`, one the room has not unlocked
 * yet (the display's `AudioUnlockOverlay` tap is what resumes it), a context that refuses to
 * start under a headless Playwright run: all of them are SILENCE, never an exception, and the
 * next cue tries again. Nothing on this board may break the picture.
 *
 * The TV's master music volume is deliberately NOT applied. That volume lives in the room's
 * `musicPlayback` state and reaches the display's single `<audio>` element; a minigame renderer
 * is handed `MinigameDisplayRendererProps`, which carry no volume, and reaching around them
 * into app state would break the minigame boundary (AGENTS.md §3.1). So the board runs at its
 * own fixed, modest master gain, tuned to sit under the party music rather than over it.
 */

export type FappyCueName =
  | "flap"
  | "crash"
  | "bump"
  | "gateCleared"
  | "handoff"
  | "finish"
  | "timedOut"
  | "tick"
  | "heartbeat";

export const FAPPY_CUE_NAMES: readonly FappyCueName[] = [
  "flap",
  "crash",
  "bump",
  "gateCleared",
  "handoff",
  "finish",
  "timedOut",
  "tick",
  "heartbeat"
];

// Where the whole board sits. Music-friendly: loud enough to read across a room over a
// playlist, quiet enough that eight gate ticks in a row are a rhythm and not a nag.
export const FAPPY_MASTER_GAIN = 0.25;

// The last stretch the clock beats through instead of ticking.
export const FAPPY_HEARTBEAT_REMAINING_MS = 15_000;

// How loud the first heartbeat is against the last one. Never silent at urgency 0 — the switch
// from tick to thump is the message, the swell is the pressure.
export const HEARTBEAT_GAIN_FLOOR = 0.35;

/**
 * The shortest gap between two soundings of the same cue. This is not a rate limiter for its
 * own sake: `handoff` is told twice on purpose (the mirror's replay lands, and the surface's
 * leg hold starts, a beat apart) and the room must hear one ding, and a mirror that
 * re-simulates a run from the top could otherwise stack a cue on itself in a single frame.
 * Different cues never gate each other.
 */
export const FAPPY_CUE_MIN_GAP_MS: Record<FappyCueName, number> = {
  flap: 45,
  crash: 200,
  bump: 90,
  gateCleared: 80,
  handoff: 900,
  finish: 1500,
  timedOut: 1500,
  tick: 250,
  heartbeat: 250
};

/** Pure: whether a cue last sounded long enough ago to sound again. */
export const isCueDue = (
  lastPlayedAtMs: number | null,
  nowMs: number,
  minGapMs: number
): boolean => {
  return lastPlayedAtMs === null || nowMs - lastPlayedAtMs >= minGapMs;
};

/** Pure: a 0..1 urgency into the gain the heartbeat thumps at. */
export const resolveHeartbeatGain = (urgency: number): number => {
  if (!Number.isFinite(urgency)) {
    return HEARTBEAT_GAIN_FLOOR;
  }

  const clamped = Math.min(1, Math.max(0, urgency));

  return HEARTBEAT_GAIN_FLOOR + (1 - HEARTBEAT_GAIN_FLOOR) * clamped;
};

export type FappyClockCueInput = {
  elapsedMs: number;
  parSeconds: number;
  limitSeconds: number;
};

export type FappyClockCue = {
  cue: "tick" | "heartbeat" | null;
  /** The whole second of relay time this belongs to; a caller fires once per new value. */
  second: number;
  /** 0 as the final stretch opens, 1 at the limit. Only meaningful for `heartbeat`. */
  urgency: number;
};

/**
 * Pure: what the clock should say at this instant. Nothing while the relay is inside par
 * (silence is the reward for being quick), a tick a second once it is past, and a heartbeat
 * instead for the last stretch — which wins even on a course whose par sits inside it. Past
 * the limit the clock has nothing left to say; the phase cue takes over.
 */
export const resolveClockCue = ({
  elapsedMs,
  parSeconds,
  limitSeconds
}: FappyClockCueInput): FappyClockCue => {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return { cue: null, second: 0, urgency: 0 };
  }

  const second = Math.floor(elapsedMs / 1000);
  const remainingMs = limitSeconds * 1000 - elapsedMs;

  if (remainingMs <= 0) {
    return { cue: null, second, urgency: 1 };
  }

  if (remainingMs <= FAPPY_HEARTBEAT_REMAINING_MS) {
    return { cue: "heartbeat", second, urgency: 1 - remainingMs / FAPPY_HEARTBEAT_REMAINING_MS };
  }

  if (parSeconds > 0 && second >= parSeconds) {
    return { cue: "tick", second, urgency: 0 };
  }

  return { cue: null, second, urgency: 0 };
};

type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export type FappyAudioContextFactory = () => AudioContext | null;

// The package's one context. Module-level on purpose: the display surface remounts between
// legs and rounds and must not leave a trail of contexts behind it.
let sharedContext: AudioContext | null = null;

const resolveSharedContext: FappyAudioContextFactory = () => {
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
    // A browser that refuses to hand one out just means a silent corridor.
    return null;
  }

  return sharedContext;
};

// The master gain and the hiss, made once per context and reused by every cue.
type CueRig = {
  master: GainNode;
  noise: AudioBuffer;
};

const rigs = new WeakMap<AudioContext, CueRig>();

// Half a second of deterministic white noise. xorshift rather than Math.random so the crash
// sounds the same on every machine and nothing here is a source of nondeterminism.
const NOISE_SECONDS = 0.5;

const createNoiseBuffer = (context: AudioContext): AudioBuffer => {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * NOISE_SECONDS));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let seed = 0x5eed5eed | 0;

  for (let index = 0; index < frameCount; index += 1) {
    seed = (seed ^ (seed << 13)) | 0;
    seed = (seed ^ (seed >>> 17)) | 0;
    seed = (seed ^ (seed << 5)) | 0;
    channel[index] = (seed >>> 0) / 0x7fffffff - 1;
  }

  return buffer;
};

const resolveRig = (context: AudioContext): CueRig => {
  const existing = rigs.get(context);

  if (existing !== undefined) {
    return existing;
  }

  const master = context.createGain();

  master.gain.setValueAtTime(FAPPY_MASTER_GAIN, context.currentTime);
  master.connect(context.destination);

  const rig: CueRig = { master, noise: createNoiseBuffer(context) };

  rigs.set(context, rig);

  return rig;
};

// Envelopes are exponential ramps, so they need a floor above zero to ramp from and to.
const SILENCE = 0.0001;
// Tail added to every `stop()` so a node is never cut before its envelope has closed.
const RELEASE_SECONDS = 0.02;

type ToneSpec = {
  startAt: number;
  durationSeconds: number;
  type: OscillatorType;
  fromHz: number;
  toHz?: number;
  peak: number;
  /** How long the swell takes. Short is a blip, long is an air horn. */
  attackSeconds?: number;
};

const playTone = (context: AudioContext, rig: CueRig, spec: ToneSpec): void => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const stopAt = spec.startAt + spec.durationSeconds;
  const peakAt = spec.startAt + Math.min(spec.attackSeconds ?? 0.006, spec.durationSeconds * 0.8);

  oscillator.type = spec.type;
  oscillator.frequency.setValueAtTime(spec.fromHz, spec.startAt);

  if (spec.toHz !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, spec.toHz), stopAt);
  }

  gain.gain.setValueAtTime(SILENCE, spec.startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, spec.peak), peakAt);
  gain.gain.exponentialRampToValueAtTime(SILENCE, stopAt);

  oscillator.connect(gain);
  gain.connect(rig.master);
  oscillator.start(spec.startAt);
  oscillator.stop(stopAt + RELEASE_SECONDS);
};

type NoiseSpec = {
  startAt: number;
  durationSeconds: number;
  peak: number;
  filterType: BiquadFilterType;
  fromHz: number;
  toHz?: number;
  q?: number;
};

const playNoise = (context: AudioContext, rig: CueRig, spec: NoiseSpec): void => {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const stopAt = spec.startAt + spec.durationSeconds;
  const peakAt = spec.startAt + Math.min(0.008, spec.durationSeconds * 0.5);

  source.buffer = rig.noise;
  filter.type = spec.filterType;
  filter.frequency.setValueAtTime(spec.fromHz, spec.startAt);

  if (spec.toHz !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(1, spec.toHz), stopAt);
  }

  if (spec.q !== undefined) {
    filter.Q.setValueAtTime(spec.q, spec.startAt);
  }

  gain.gain.setValueAtTime(SILENCE, spec.startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, spec.peak), peakAt);
  gain.gain.exponentialRampToValueAtTime(SILENCE, stopAt);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(rig.master);
  source.start(spec.startAt);
  source.stop(stopAt + RELEASE_SECONDS);
};

type CueVoice = (context: AudioContext, rig: CueRig, startAt: number, intensity: number) => void;

// One voice per cue. Durations are the spec's; the numbers are a table to retune, not a system.
const CUE_VOICES: Record<FappyCueName, CueVoice> = {
  // A soft fwip of air, not a click: a band of noise sliding down, over in 60 ms. It fires ten
  // times a second at full mash, so it has to be the quietest thing on the board bar the gate.
  flap: (context, rig, startAt) => {
    playNoise(context, rig, {
      startAt,
      durationSeconds: 0.06,
      peak: 0.16,
      filterType: "bandpass",
      fromHz: 1500,
      toHz: 700,
      q: 1.2
    });
  },
  // A splat and a thud together: the sand takes the bird.
  crash: (context, rig, startAt) => {
    playNoise(context, rig, {
      startAt,
      durationSeconds: 0.22,
      peak: 0.9,
      filterType: "lowpass",
      fromHz: 2400,
      toHz: 300
    });
    playTone(context, rig, {
      startAt,
      durationSeconds: 0.25,
      type: "sine",
      fromHz: 150,
      toHz: 45,
      peak: 0.85
    });
  },
  // An eagle's shove or a glob landing: a short wet squelch, no low end, nothing fatal about it.
  bump: (context, rig, startAt) => {
    playTone(context, rig, {
      startAt,
      durationSeconds: 0.13,
      type: "sawtooth",
      fromHz: 320,
      toHz: 90,
      peak: 0.45
    });
    playNoise(context, rig, {
      startAt,
      durationSeconds: 0.09,
      peak: 0.25,
      filterType: "bandpass",
      fromHz: 900,
      toHz: 300,
      q: 2
    });
  },
  // The quietest cue on the board by a distance. Thirty-two of these across a turn should read
  // as a rhythm picking up, never as an alarm.
  gateCleared: (context, rig, startAt) => {
    playTone(context, rig, {
      startAt,
      durationSeconds: 0.04,
      type: "triangle",
      fromHz: 1600,
      toHz: 2100,
      peak: 0.055
    });
  },
  // Two bright notes up: the tablet has changed hands.
  handoff: (context, rig, startAt) => {
    playTone(context, rig, {
      startAt,
      durationSeconds: 0.12,
      type: "triangle",
      fromHz: 988,
      peak: 0.28
    });
    playTone(context, rig, {
      startAt: startAt + 0.1,
      durationSeconds: 0.2,
      type: "triangle",
      fromHz: 1319,
      peak: 0.26
    });
  },
  // An air horn, near enough: two detuned saws swelling a fifth apart with a breath of air
  // over them, seven hundred milliseconds of it.
  finish: (context, rig, startAt) => {
    playTone(context, rig, {
      startAt,
      durationSeconds: 0.7,
      type: "sawtooth",
      fromHz: 196,
      toHz: 392,
      peak: 0.32,
      attackSeconds: 0.25
    });
    playTone(context, rig, {
      startAt,
      durationSeconds: 0.7,
      type: "sawtooth",
      fromHz: 294,
      toHz: 588,
      peak: 0.2,
      attackSeconds: 0.3
    });
    playNoise(context, rig, {
      startAt,
      durationSeconds: 0.68,
      peak: 0.1,
      filterType: "highpass",
      fromHz: 800,
      toHz: 2200
    });
  },
  // Three notes down: the clock beat them.
  timedOut: (context, rig, startAt) => {
    playTone(context, rig, { startAt, durationSeconds: 0.22, type: "triangle", fromHz: 440, peak: 0.3 });
    playTone(context, rig, {
      startAt: startAt + 0.2,
      durationSeconds: 0.22,
      type: "triangle",
      fromHz: 349,
      peak: 0.29
    });
    playTone(context, rig, {
      startAt: startAt + 0.4,
      durationSeconds: 0.36,
      type: "triangle",
      fromHz: 262,
      peak: 0.28
    });
  },
  // A metronome's click, once a second past par.
  tick: (context, rig, startAt) => {
    playTone(context, rig, { startAt, durationSeconds: 0.025, type: "square", fromHz: 1200, peak: 0.11 });
  },
  // Low double thump. `intensity` is the 0..1 urgency; it gets louder as the limit closes.
  heartbeat: (context, rig, startAt, intensity) => {
    const gain = resolveHeartbeatGain(intensity);

    playTone(context, rig, {
      startAt,
      durationSeconds: 0.13,
      type: "sine",
      fromHz: 90,
      toHz: 38,
      peak: 0.55 * gain
    });
    playTone(context, rig, {
      startAt: startAt + 0.2,
      durationSeconds: 0.16,
      type: "sine",
      fromHz: 78,
      toHz: 34,
      peak: 0.42 * gain
    });
  }
};

export type FappySoundboard = {
  /**
   * Sound a cue now. `intensity` is 0..1 and only `heartbeat` reads it. Never throws: a
   * missing, blocked or still-suspended context is silence, and the next cue tries again.
   */
  play: (cue: FappyCueName, intensity?: number) => void;
};

export type FappySoundboardOptions = {
  /** Injected in tests; the AudioContext itself is not unit-testable. */
  createContext?: FappyAudioContextFactory;
  now?: () => number;
};

export const createFappySoundboard = (options: FappySoundboardOptions = {}): FappySoundboard => {
  const createContext = options.createContext ?? resolveSharedContext;
  const now = options.now ?? ((): number => Date.now());
  const lastPlayedAtMs = new Map<FappyCueName, number>();

  const play = (cue: FappyCueName, intensity = 1): void => {
    try {
      const atMs = now();

      if (!isCueDue(lastPlayedAtMs.get(cue) ?? null, atMs, FAPPY_CUE_MIN_GAP_MS[cue])) {
        return;
      }

      const context = createContext();

      if (context === null) {
        return;
      }

      // Resume on every cue, not once: the room taps the display's unlock overlay at some
      // point we do not get told about, and a tab that goes to the background suspends again.
      if (context.state !== "running") {
        void Promise.resolve(context.resume()).catch(() => undefined);

        // Still not running. Scheduling into a suspended context would queue the cue and
        // dump the backlog at once when it wakes, so drop it: the next cue is milliseconds
        // away and the clock's own cues keep retrying for as long as the relay runs.
        return;
      }

      lastPlayedAtMs.set(cue, atMs);
      // A hair in the future, because a node started exactly at `currentTime` can click.
      CUE_VOICES[cue](context, resolveRig(context), context.currentTime + 0.002, intensity);
    } catch {
      // Best-effort, like the house's other synthesised cue: audio must never break the
      // corridor, the mirror's rAF loop, or a headless test run.
    }
  };

  return { play };
};
