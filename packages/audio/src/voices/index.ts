// The two instruments every cue in the house is played on: a tone (one
// oscillator under a gain envelope, optionally sliding in pitch) and a burst
// of filtered noise. There are no audio files anywhere in the show — a party
// pack must not carry a megabyte of samples and this machine has no MP3
// encoder to make them with — so a cue is a few of these scheduled a hair
// apart, and the numbers in a cue table are the whole sound.
//
// A voice is handed a `CueRig`: the context, the gain node the board's cues
// leave through, and the one noise buffer the board made for that context.
// It schedules against `startAt` (a context time, not a wall clock) and never
// reads the clock itself, so a cue of three tones lands as one sound.

export type CueRig = {
  context: AudioContext;
  // The board's own master, already routed into its bus.
  out: GainNode;
  // Half a second of deterministic white noise, shared by every noise voice.
  noise: AudioBuffer;
};

export type ToneSpec = {
  startAt: number;
  durationSeconds: number;
  type: OscillatorType;
  fromHz: number;
  toHz?: number;
  peak: number;
  // How long the swell takes. Short is a blip, long is an air horn.
  attackSeconds?: number;
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

// Envelopes are exponential ramps, so they need a floor above zero to ramp
// from and to.
const SILENCE = 0.0001;
// Tail added to every `stop()` so a node is never cut before its envelope has
// closed.
const RELEASE_SECONDS = 0.02;
const DEFAULT_TONE_ATTACK_SECONDS = 0.006;
const NOISE_ATTACK_SECONDS = 0.008;

export const playTone = (rig: CueRig, spec: ToneSpec): void => {
  const { context } = rig;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const stopAt = spec.startAt + spec.durationSeconds;
  const peakAt =
    spec.startAt +
    Math.min(spec.attackSeconds ?? DEFAULT_TONE_ATTACK_SECONDS, spec.durationSeconds * 0.8);

  oscillator.type = spec.type;
  oscillator.frequency.setValueAtTime(spec.fromHz, spec.startAt);

  if (spec.toHz !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, spec.toHz), stopAt);
  }

  gain.gain.setValueAtTime(SILENCE, spec.startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, spec.peak), peakAt);
  gain.gain.exponentialRampToValueAtTime(SILENCE, stopAt);

  oscillator.connect(gain);
  gain.connect(rig.out);
  oscillator.start(spec.startAt);
  oscillator.stop(stopAt + RELEASE_SECONDS);
};

export const playNoise = (rig: CueRig, spec: NoiseSpec): void => {
  const { context } = rig;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const stopAt = spec.startAt + spec.durationSeconds;
  const peakAt = spec.startAt + Math.min(NOISE_ATTACK_SECONDS, spec.durationSeconds * 0.5);

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
  gain.connect(rig.out);
  source.start(spec.startAt);
  source.stop(stopAt + RELEASE_SECONDS);
};

// Half a second of deterministic white noise. xorshift rather than
// Math.random so a crash sounds the same on every machine and nothing in the
// house's audio is a source of nondeterminism.
const NOISE_SECONDS = 0.5;

export const createNoiseBuffer = (context: AudioContext): AudioBuffer => {
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
