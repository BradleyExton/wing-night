/**
 * The house synth: every noise a minigame's TV makes, made here and now from oscillators, one
 * buffer of noise and gain envelopes. No audio files — a party pack must not carry a megabyte
 * of effects and this machine has no MP3 encoder to make them with.
 *
 * It is the TV's board, never the tablet's: the display is the room's speaker. A game
 * describes its cues as a table of voices and the shortest gap each may repeat at, and gets a
 * board back; the engine, the shared `AudioContext` and the best-effort rules live here once.
 *
 * ONE AudioContext for the whole tab, made on the first cue and kept for good: contexts are a
 * scarce per-tab resource, and nothing here ever closes one.
 *
 * Every cue is best-effort. No `AudioContext`, one the room has not unlocked yet (the display's
 * unlock overlay tap is what resumes it), one that refuses to start under a headless run: all
 * of them are SILENCE, never an exception. Nothing on a board may break the picture.
 *
 * The TV's music volume is deliberately not applied: it lives in app state a minigame renderer
 * cannot reach (AGENTS.md §3.1). A board runs at its own fixed, modest master gain, tuned to sit
 * under the party music.
 */

/** Pure: whether a cue last sounded long enough ago to sound again. */
export const isCueDue = (
  lastPlayedAtMs: number | null,
  nowMs: number,
  minGapMs: number
): boolean => {
  return lastPlayedAtMs === null || nowMs - lastPlayedAtMs >= minGapMs;
};

type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export type AudioContextFactory = () => AudioContext | null;

// The tab's one context. Module-level on purpose: display surfaces remount between turns and
// rounds and must not leave a trail of contexts behind them.
let sharedContext: AudioContext | null = null;

export const resolveSharedAudioContext: AudioContextFactory = () => {
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
    // A browser that refuses to hand one out just means a silent room.
    return null;
  }

  return sharedContext;
};

/** The master gain and the hiss, made once per context and reused by every cue. */
export type CueRig = {
  master: GainNode;
  noise: AudioBuffer;
};

const rigs = new WeakMap<AudioContext, Map<number, CueRig>>();

// Half a second of deterministic white noise. xorshift rather than Math.random so a crash
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

// One rig per (context, master gain): two boards on one tab at different levels each keep
// their own master, and share the noise through it.
const resolveRig = (context: AudioContext, masterGain: number): CueRig => {
  const byGain = rigs.get(context) ?? new Map<number, CueRig>();
  const existing = byGain.get(masterGain);

  if (existing !== undefined) {
    return existing;
  }

  const master = context.createGain();

  master.gain.setValueAtTime(masterGain, context.currentTime);
  master.connect(context.destination);

  const rig: CueRig = { master, noise: createNoiseBuffer(context) };

  byGain.set(masterGain, rig);
  rigs.set(context, byGain);

  return rig;
};

// Envelopes are exponential ramps, so they need a floor above zero to ramp from and to.
const SILENCE = 0.0001;
// Tail added to every `stop()` so a node is never cut before its envelope has closed.
const RELEASE_SECONDS = 0.02;

export type ToneSpec = {
  startAt: number;
  durationSeconds: number;
  type: OscillatorType;
  fromHz: number;
  toHz?: number;
  peak: number;
  /** How long the swell takes. Short is a blip, long is an air horn. */
  attackSeconds?: number;
};

export const playTone = (context: AudioContext, rig: CueRig, spec: ToneSpec): void => {
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

export type NoiseSpec = {
  startAt: number;
  durationSeconds: number;
  peak: number;
  filterType: BiquadFilterType;
  fromHz: number;
  toHz?: number;
  q?: number;
};

export const playNoise = (context: AudioContext, rig: CueRig, spec: NoiseSpec): void => {
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

/** One cue's sound: a function of the context, the rig, when to start and a 0..1 intensity. */
export type CueVoice = (context: AudioContext, rig: CueRig, startAt: number, intensity: number) => void;

export type Soundboard<CueName extends string> = {
  /**
   * Sound a cue now. `intensity` is 0..1 and only the voices that read it care. Never throws:
   * a missing, blocked or still-suspended context is silence, and the next cue tries again.
   */
  play: (cue: CueName, intensity?: number) => void;
};

export type SoundboardSpec<CueName extends string> = {
  voices: Record<CueName, CueVoice>;
  /**
   * The shortest gap between two soundings of the same cue. Not a rate limiter for its own
   * sake: a mirror that re-simulates a run from the top could stack a cue on itself in one
   * frame, and a beat told twice must sound once. Different cues never gate each other.
   */
  minGapMs: Record<CueName, number>;
  /** Where the whole board sits: loud enough to read across a room over a playlist, no more. */
  masterGain: number;
  /** Injected in tests; the AudioContext itself is not unit-testable. */
  createContext?: AudioContextFactory;
  now?: () => number;
};

export const createSoundboard = <CueName extends string>(
  spec: SoundboardSpec<CueName>
): Soundboard<CueName> => {
  const createContext = spec.createContext ?? resolveSharedAudioContext;
  const now = spec.now ?? ((): number => Date.now());
  const lastPlayedAtMs = new Map<CueName, number>();

  const play = (cue: CueName, intensity = 1): void => {
    try {
      const atMs = now();

      if (!isCueDue(lastPlayedAtMs.get(cue) ?? null, atMs, spec.minGapMs[cue])) {
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
        // dump the backlog at once when it wakes, so drop it: the next cue is milliseconds away.
        return;
      }

      lastPlayedAtMs.set(cue, atMs);
      // A hair in the future, because a node started exactly at `currentTime` can click.
      spec.voices[cue](context, resolveRig(context, spec.masterGain), context.currentTime + 0.002, intensity);
    } catch {
      // Best-effort: audio must never break a scene, a rAF loop, or a headless test run.
    }
  };

  return { play };
};
