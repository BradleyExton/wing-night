import {
  createSoundboard,
  playNoise,
  playTone,
  type CueRig,
  type CueTable,
  type CueVoice,
  type Soundboard,
  type SoundboardOptions
} from "@wingnight/audio";

/**
 * BRAWL's soundboard: the street's noises, as a table of voices for the house board
 * (`@wingnight/audio`). The TV's board, never the tablet's: the display is the room's speaker
 * (the tablet only sounds when it is the whole game, `solo`). Everything here is best-effort and
 * silent when it cannot sound.
 */
export type BrawlCueName =
  | "peck"
  | "land"
  | "honk"
  | "hurt"
  | "ko"
  | "go"
  | "handoff"
  | "bay"
  | "bell"
  | "boss";

export const BRAWL_CUE_NAMES: readonly BrawlCueName[] = [
  "peck",
  "land",
  "honk",
  "hurt",
  "ko",
  "go",
  "handoff",
  "bay",
  "bell",
  "boss"
];

// The pack folder its recorded takes live in: `assets/sfx/brawl/honk-1.mp3` is a take of `honk`.
// A cue with none keeps its synthesis.
export const BRAWL_SFX_FOLDER = "brawl";

// Music-friendly: loud enough to read across a room over a playlist, quiet enough that a hen
// mashing the peck zone is a run of ticks and not a nag.
export const BRAWL_MASTER_GAIN = 0.25;

/**
 * The shortest gap between two soundings of the same cue. `peck` is the tightest: the right
 * thumb mashes the zone at a handful a second, and each tick should be heard as one; `land` is
 * the same peck connecting, a beat behind it; the beats that are told twice (the mirror's
 * outcome and the surface's hold, a beat apart) collapse into one sounding.
 */
export const BRAWL_CUE_MIN_GAP_MS: Record<BrawlCueName, number> = {
  peck: 60,
  land: 90,
  honk: 500,
  hurt: 250,
  ko: 1200,
  go: 900,
  handoff: 900,
  bay: 1500,
  bell: 1500,
  boss: 2500
};

/**
 * `honk`'s `intensity` is the goose's heft, 0..1: the larger the bird, the lower and longer the
 * honk. A common goon is this much of the way up; the boss passes 1. The board's default
 * intensity is 1, so a caller sounding an ordinary goose names this and does not leave it out.
 */
export const BRAWL_HONK_GOON_INTENSITY = 0.3;

/** Pure: the honk's first-note pitch for a goose of this heft, falling from 560 Hz to 250 Hz. */
export const resolveHonkHz = (heft: number): number => {
  const share = Math.min(1, Math.max(0, heft));

  return 560 - share * 310;
};

/** Pure: a heavier goose holds each note longer, 0.14 s for a goon up to 0.28 s for the boss. */
export const resolveHonkSeconds = (heft: number): number => {
  const share = Math.min(1, Math.max(0, heft));

  return 0.14 + share * 0.14;
};

// One nasal note of the goose: a saw with a square a fifth above it for the reedy edge, dropping
// fast from the attack down to the body of the note.
const playHonkNote = (rig: CueRig, startAt: number, hz: number, seconds: number): void => {
  playTone(rig, { startAt, durationSeconds: seconds, type: "sawtooth", fromHz: hz * 1.35, toHz: hz * 0.8, peak: 0.26, attackSeconds: 0.012 });
  playTone(rig, { startAt, durationSeconds: seconds, type: "square", fromHz: hz * 2.02, toHz: hz * 1.6, peak: 0.08, attackSeconds: 0.012 });
  playNoise(rig, { startAt, durationSeconds: seconds * 0.8, peak: 0.07, filterType: "bandpass", fromHz: hz * 3, q: 2 });
};

// One voice per cue. The numbers are a table to retune, not a system.
const CUE_VOICES: Record<BrawlCueName, CueVoice> = {
  // The peck: a quick dry tick, a flick of noise with a small pitch blip on it.
  peck: (rig, startAt) => {
    playNoise(rig, { startAt, durationSeconds: 0.035, peak: 0.4, filterType: "bandpass", fromHz: 2600, toHz: 1800, q: 1.4 });
    playTone(rig, { startAt, durationSeconds: 0.04, type: "triangle", fromHz: 900, toHz: 1300, peak: 0.16 });
  },
  // The peck connecting: a meatier thump with a blip climbing out of it, the goose taking it.
  land: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.12, type: "sine", fromHz: 170, toHz: 60, peak: 0.5 });
    playNoise(rig, { startAt, durationSeconds: 0.07, peak: 0.34, filterType: "lowpass", fromHz: 1800, toHz: 500 });
    playTone(rig, { startAt: startAt + 0.03, durationSeconds: 0.1, type: "square", fromHz: 420, toHz: 840, peak: 0.12 });
  },
  // The telegraph: two nasal notes, the second a little lower. A heavier goose honks lower and
  // longer; the boss's is the longest and the lowest.
  honk: (rig, startAt, intensity) => {
    const hz = resolveHonkHz(intensity);
    const seconds = resolveHonkSeconds(intensity);

    playHonkNote(rig, startAt, hz, seconds);
    playHonkNote(rig, startAt + seconds * 1.15, hz * 0.88, seconds * 1.1);
  },
  // The hen's been hit: a falling "bonk" and a short crunch of noise on it.
  hurt: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.22, type: "triangle", fromHz: 520, toHz: 150, peak: 0.34 });
    playNoise(rig, { startAt, durationSeconds: 0.1, peak: 0.4, filterType: "bandpass", fromHz: 1400, toHz: 400, q: 1.1 });
  },
  // A goon down: the thud of the fall, then a little descending twinkle for the stars.
  ko: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.24, type: "sine", fromHz: 140, toHz: 44, peak: 0.5 });
    playNoise(rig, { startAt, durationSeconds: 0.14, peak: 0.4, filterType: "lowpass", fromHz: 1200, toHz: 260 });
    for (const [index, hz] of [1568, 1319, 1047, 880].entries()) {
      playTone(rig, { startAt: startAt + 0.2 + index * 0.07, durationSeconds: 0.12, type: "triangle", fromHz: hz, peak: 0.1 });
    }
  },
  // The GO arrow: a bright two-note chime, climbing.
  go: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.14, type: "triangle", fromHz: 784, peak: 0.26 });
    playTone(rig, { startAt: startAt + 0.11, durationSeconds: 0.24, type: "triangle", fromHz: 1175, peak: 0.26 });
    playTone(rig, { startAt: startAt + 0.11, durationSeconds: 0.2, type: "sine", fromHz: 2350, peak: 0.06 });
  },
  // The tablet changes hands: three notes up, the last held.
  handoff: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.1, type: "triangle", fromHz: 659, peak: 0.26 });
    playTone(rig, { startAt: startAt + 0.09, durationSeconds: 0.1, type: "triangle", fromHz: 880, peak: 0.26 });
    playTone(rig, { startAt: startAt + 0.18, durationSeconds: 0.3, type: "triangle", fromHz: 1319, peak: 0.28 });
  },
  // The bay: a splash, a swell of noise with the filter sweeping closed as it sinks.
  bay: (rig, startAt) => {
    playNoise(rig, { startAt, durationSeconds: 0.7, peak: 0.45, filterType: "lowpass", fromHz: 4200, toHz: 250, q: 0.8 });
    playNoise(rig, { startAt: startAt + 0.05, durationSeconds: 0.35, peak: 0.16, filterType: "bandpass", fromHz: 1600, toHz: 700, q: 0.9 });
    playTone(rig, { startAt, durationSeconds: 0.3, type: "sine", fromHz: 200, toHz: 70, peak: 0.22 });
  },
  // The boxing bell, struck twice: a bright metallic clang (inharmonic partials) that rings on.
  bell: (rig, startAt) => {
    for (const at of [0, 0.32]) {
      playTone(rig, { startAt: startAt + at, durationSeconds: 1.1, type: "sine", fromHz: 1180, peak: 0.24, attackSeconds: 0.004 });
      playTone(rig, { startAt: startAt + at, durationSeconds: 0.8, type: "sine", fromHz: 1770, peak: 0.12, attackSeconds: 0.004 });
      playTone(rig, { startAt: startAt + at, durationSeconds: 0.5, type: "sine", fromHz: 3010, peak: 0.07, attackSeconds: 0.004 });
      playNoise(rig, { startAt: startAt + at, durationSeconds: 0.05, peak: 0.18, filterType: "highpass", fromHz: 4000 });
    }
  },
  // The boss steps on: a low ominous drone, two tones a fifth apart, held for a second.
  boss: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 1.2, type: "sawtooth", fromHz: 65.4, toHz: 61, peak: 0.3, attackSeconds: 0.35 });
    playTone(rig, { startAt, durationSeconds: 1.2, type: "sawtooth", fromHz: 98, toHz: 92, peak: 0.2, attackSeconds: 0.4 });
    playNoise(rig, { startAt, durationSeconds: 1, peak: 0.08, filterType: "lowpass", fromHz: 300, toHz: 140 });
  }
};

// The board's table: each cue's voice beside the gap it may repeat at.
export const BRAWL_CUES: CueTable<BrawlCueName> = Object.fromEntries(
  BRAWL_CUE_NAMES.map((cue) => [cue, { minGapMs: BRAWL_CUE_MIN_GAP_MS[cue], voice: CUE_VOICES[cue] }])
) as CueTable<BrawlCueName>;

export type BrawlSoundboard = Soundboard<BrawlCueName>;

export type BrawlSoundboardOptions = Pick<
  SoundboardOptions<BrawlCueName>,
  "createContext" | "now" | "takes" | "loadTake"
>;

export const createBrawlSoundboard = (options: BrawlSoundboardOptions = {}): BrawlSoundboard =>
  createSoundboard({ cues: BRAWL_CUES, masterGain: BRAWL_MASTER_GAIN, ...options });
