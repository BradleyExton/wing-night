import {
  createSoundboard,
  playNoise,
  playTone,
  type AudioContextFactory,
  type CueVoice,
  type Soundboard
} from "@wingnight/surface";

/**
 * SCHLONIC's soundboard: the zone's noises, as a table of voices for the house synth
 * (`@wingnight/surface`). The TV's board, never the tablet's: the display is the room's
 * speaker. Everything here is best-effort and silent when it cannot sound.
 */
export type SchlonicCueName =
  | "wing"
  | "spring"
  | "pop"
  | "hit"
  | "fell"
  | "wiped"
  | "post"
  | "bankTick"
  | "handoff"
  | "finish";

export const SCHLONIC_CUE_NAMES: readonly SchlonicCueName[] = [
  "wing",
  "spring",
  "pop",
  "hit",
  "fell",
  "wiped",
  "post",
  "bankTick",
  "handoff",
  "finish"
];

// Music-friendly: loud enough to read across a room over a playlist, quiet enough that a line
// of ten wings is a run of notes and not a nag.
export const SCHLONIC_MASTER_GAIN = 0.25;

/**
 * The shortest gap between two soundings of the same cue. A wing line passes at one wing every
 * ~120 ms at top speed, so `wing` is the tightest; `bankTick` is the count-up at the post, held
 * to a rate a room can hear as counting; the beats that are told twice (the mirror's outcome and
 * the surface's hold, a beat apart) collapse into one sounding.
 */
export const SCHLONIC_CUE_MIN_GAP_MS: Record<SchlonicCueName, number> = {
  wing: 40,
  spring: 150,
  pop: 120,
  hit: 250,
  fell: 1500,
  wiped: 1500,
  post: 1500,
  bankTick: 45,
  handoff: 900,
  finish: 1500
};

/** How many wings in hand it takes for the pickup chime to reach the top of its climb. */
export const WING_CHIME_TOP_AT = 40;

/** Pure: the pickup chime climbs with the handful, so a greedy line sounds like one. */
export const resolveWingChimeHz = (wingsInHand: number): number => {
  const share = Math.min(1, Math.max(0, wingsInHand) / WING_CHIME_TOP_AT);

  return 1320 + share * 880;
};

// One voice per cue. The numbers are a table to retune, not a system.
const CUE_VOICES: Record<SchlonicCueName, CueVoice> = {
  // Sonic's ring, near enough: a bright two-note blip that climbs with the handful. `intensity`
  // carries the wings in hand as a 0..1 share of the climb.
  wing: (context, rig, startAt, intensity) => {
    const hz = resolveWingChimeHz(intensity * WING_CHIME_TOP_AT);

    playTone(context, rig, { startAt, durationSeconds: 0.05, type: "triangle", fromHz: hz, peak: 0.12 });
    playTone(context, rig, {
      startAt: startAt + 0.045,
      durationSeconds: 0.07,
      type: "triangle",
      fromHz: hz * 1.5,
      peak: 0.1
    });
  },
  // A boing: a sine bent up hard, with a touch of air.
  spring: (context, rig, startAt) => {
    playTone(context, rig, {
      startAt,
      durationSeconds: 0.28,
      type: "sine",
      fromHz: 180,
      toHz: 900,
      peak: 0.4,
      attackSeconds: 0.02
    });
    playNoise(context, rig, { startAt, durationSeconds: 0.08, peak: 0.12, filterType: "bandpass", fromHz: 1200, q: 1.5 });
  },
  // A badnik popping under a ball: a short wet burst and a squeak down.
  pop: (context, rig, startAt) => {
    playNoise(context, rig, { startAt, durationSeconds: 0.09, peak: 0.45, filterType: "bandpass", fromHz: 700, toHz: 250, q: 2 });
    playTone(context, rig, { startAt, durationSeconds: 0.12, type: "square", fromHz: 520, toHz: 140, peak: 0.18 });
  },
  // Half the handful gone: a scatter of noise and a low knock, nothing fatal about it.
  hit: (context, rig, startAt) => {
    playNoise(context, rig, { startAt, durationSeconds: 0.2, peak: 0.6, filterType: "highpass", fromHz: 1800, toHz: 4000 });
    playTone(context, rig, { startAt, durationSeconds: 0.16, type: "sawtooth", fromHz: 240, toHz: 70, peak: 0.35 });
  },
  // Down a hole: a whistle falling away, then the bay takes it.
  fell: (context, rig, startAt) => {
    playTone(context, rig, {
      startAt,
      durationSeconds: 0.55,
      type: "sine",
      fromHz: 900,
      toHz: 120,
      peak: 0.3,
      attackSeconds: 0.03
    });
    playNoise(context, rig, {
      startAt: startAt + 0.5,
      durationSeconds: 0.3,
      peak: 0.5,
      filterType: "lowpass",
      fromHz: 1800,
      toHz: 300
    });
  },
  // Wiped out: three notes down, the game beat them.
  wiped: (context, rig, startAt) => {
    playTone(context, rig, { startAt, durationSeconds: 0.2, type: "triangle", fromHz: 440, peak: 0.3 });
    playTone(context, rig, { startAt: startAt + 0.18, durationSeconds: 0.2, type: "triangle", fromHz: 349, peak: 0.29 });
    playTone(context, rig, { startAt: startAt + 0.36, durationSeconds: 0.34, type: "triangle", fromHz: 262, peak: 0.28 });
  },
  // The post: an act-clear fanfare, three notes up and a held fifth.
  post: (context, rig, startAt) => {
    playTone(context, rig, { startAt, durationSeconds: 0.12, type: "square", fromHz: 523, peak: 0.16 });
    playTone(context, rig, { startAt: startAt + 0.11, durationSeconds: 0.12, type: "square", fromHz: 659, peak: 0.16 });
    playTone(context, rig, { startAt: startAt + 0.22, durationSeconds: 0.45, type: "square", fromHz: 784, peak: 0.18 });
    playTone(context, rig, { startAt: startAt + 0.22, durationSeconds: 0.45, type: "triangle", fromHz: 1047, peak: 0.12, attackSeconds: 0.05 });
  },
  // One wing into the bank: a tick that climbs as the count does. `intensity` is the share counted.
  bankTick: (context, rig, startAt, intensity) => {
    playTone(context, rig, {
      startAt,
      durationSeconds: 0.03,
      type: "square",
      fromHz: 1000 + intensity * 900,
      peak: 0.1
    });
  },
  // Two bright notes up: the tablet has changed hands.
  handoff: (context, rig, startAt) => {
    playTone(context, rig, { startAt, durationSeconds: 0.12, type: "triangle", fromHz: 988, peak: 0.28 });
    playTone(context, rig, { startAt: startAt + 0.1, durationSeconds: 0.2, type: "triangle", fromHz: 1319, peak: 0.26 });
  },
  // The team is through: an air horn, near enough.
  finish: (context, rig, startAt) => {
    playTone(context, rig, { startAt, durationSeconds: 0.7, type: "sawtooth", fromHz: 196, toHz: 392, peak: 0.32, attackSeconds: 0.25 });
    playTone(context, rig, { startAt, durationSeconds: 0.7, type: "sawtooth", fromHz: 294, toHz: 588, peak: 0.2, attackSeconds: 0.3 });
    playNoise(context, rig, { startAt, durationSeconds: 0.68, peak: 0.1, filterType: "highpass", fromHz: 800, toHz: 2200 });
  }
};

export type SchlonicSoundboard = Soundboard<SchlonicCueName>;

export type SchlonicSoundboardOptions = {
  createContext?: AudioContextFactory;
  now?: () => number;
};

export const createSchlonicSoundboard = (options: SchlonicSoundboardOptions = {}): SchlonicSoundboard => {
  return createSoundboard<SchlonicCueName>({
    voices: CUE_VOICES,
    minGapMs: SCHLONIC_CUE_MIN_GAP_MS,
    masterGain: SCHLONIC_MASTER_GAIN,
    ...(options.createContext === undefined ? {} : { createContext: options.createContext }),
    ...(options.now === undefined ? {} : { now: options.now })
  });
};
