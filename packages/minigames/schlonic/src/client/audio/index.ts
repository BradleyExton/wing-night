import {
  createSoundboard,
  playNoise,
  playTone,
  type CueTable,
  type CueTakes,
  type CueVoice,
  type Soundboard,
  type SoundboardOptions
} from "@wingnight/audio";

/**
 * SCHLONIC's soundboard: the zone's noises, as a table of voices for the house board
 * (`@wingnight/audio`). The TV's board, never the tablet's: the display is the room's
 * speaker. Everything here is best-effort and silent when it cannot sound.
 */
export type SchlonicCueName =
  | "wing"
  | "ollie"
  | "land"
  | "grindOn"
  | "grind"
  | "grindOff"
  | "spring"
  | "slam"
  | "hit"
  | "fell"
  | "wiped"
  | "thud"
  | "chitter"
  | "chomp"
  | "burp"
  | "post"
  | "riser"
  | "bankTick"
  | "handoff"
  | "finish";

export const SCHLONIC_CUE_NAMES: readonly SchlonicCueName[] = [
  "wing",
  "ollie",
  "land",
  "grindOn",
  "grind",
  "grindOff",
  "spring",
  "slam",
  "hit",
  "fell",
  "wiped",
  "thud",
  "chitter",
  "chomp",
  "burp",
  "post",
  "riser",
  "bankTick",
  "handoff",
  "finish"
];

// The pack folder its recorded takes live in: `assets/sfx/schlonic/hit-1.mp3` is a take of `hit`.
// A cue with none keeps its synthesis. The pack may still hold takes for cues this board no
// longer has (the bay's `splash`, the gull's `squawk`); `resolveSchlonicTakes` leaves them out.
export const SCHLONIC_SFX_FOLDER = "schlonic";

// Music-friendly: loud enough to read across a room over a playlist, quiet enough that a line
// of ten wings is a run of notes and not a nag.
export const SCHLONIC_MASTER_GAIN = 0.25;

/**
 * The shortest gap between two soundings of the same cue. A wing line passes at one wing every
 * ~120 ms at top speed, so `wing` is the tightest; `grind` is a scrape sounded every few units along
 * a rail, close enough together that the ticks run into one; `bankTick` is the count-up at the post, held
 * to a rate a room can hear as counting; the beats that are told twice (the mirror's outcome and
 * the surface's hold, a beat apart) collapse into one sounding.
 */
export const SCHLONIC_CUE_MIN_GAP_MS: Record<SchlonicCueName, number> = {
  wing: 40,
  ollie: 90,
  land: 90,
  grindOn: 200,
  grind: 60,
  grindOff: 200,
  spring: 150,
  slam: 200,
  hit: 250,
  fell: 1500,
  wiped: 1500,
  thud: 1500,
  chitter: 600,
  chomp: 60,
  burp: 1500,
  post: 1500,
  riser: 3000,
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
  wing: (rig, startAt, intensity) => {
    const hz = resolveWingChimeHz(intensity * WING_CHIME_TOP_AT);

    playTone(rig, { startAt, durationSeconds: 0.05, type: "triangle", fromHz: hz, peak: 0.12 });
    playTone(rig, {
      startAt: startAt + 0.045,
      durationSeconds: 0.07,
      type: "triangle",
      fromHz: hz * 1.5,
      peak: 0.1
    });
  },
  // The ollie: the tail slapping the concrete. A hard wooden knock with a crack of grit on it.
  ollie: (rig, startAt) => {
    playNoise(rig, { startAt, durationSeconds: 0.05, peak: 0.5, filterType: "bandpass", fromHz: 1800, toHz: 900, q: 1.2 });
    playTone(rig, { startAt, durationSeconds: 0.07, type: "triangle", fromHz: 340, toHz: 150, peak: 0.34 });
  },
  // Four wheels back on the sidewalk: a low, dull clack and a rattle of trucks.
  land: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.06, type: "square", fromHz: 180, toHz: 90, peak: 0.2 });
    playNoise(rig, { startAt, durationSeconds: 0.09, peak: 0.34, filterType: "bandpass", fromHz: 1300, toHz: 500, q: 1.6 });
  },
  // Onto a rail: steel on steel, a clank with a ring to it, then the scrape takes over.
  grindOn: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.22, type: "square", fromHz: 1480, toHz: 1320, peak: 0.1 });
    playTone(rig, { startAt, durationSeconds: 0.3, type: "triangle", fromHz: 2210, peak: 0.08 });
    playNoise(rig, { startAt, durationSeconds: 0.14, peak: 0.4, filterType: "highpass", fromHz: 2600, toHz: 3800 });
  },
  // Along the rail: a bright metal scrape, sounded over and over as the truck slides so the ticks
  // run together into one long grind.
  grind: (rig, startAt) => {
    playNoise(rig, { startAt, durationSeconds: 0.13, peak: 0.22, filterType: "bandpass", fromHz: 3600, toHz: 3100, q: 3 });
    playNoise(rig, { startAt, durationSeconds: 0.13, peak: 0.08, filterType: "highpass", fromHz: 6000 });
  },
  // Off the end of it: the rail rings on after the truck has gone.
  grindOff: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.35, type: "triangle", fromHz: 1760, toHz: 1700, peak: 0.08 });
  },
  // A boing: a sine bent up hard, with a touch of air.
  spring: (rig, startAt) => {
    playTone(rig, {
      startAt,
      durationSeconds: 0.28,
      type: "sine",
      fromHz: 180,
      toHz: 900,
      peak: 0.4,
      attackSeconds: 0.02
    });
    playNoise(rig, { startAt, durationSeconds: 0.08, peak: 0.12, filterType: "bandpass", fromHz: 1200, q: 1.5 });
  },
  // The slam: a short whoosh falling away, the air the board drops through. The landing is the
  // ordinary `land`, sounded when the feet get there.
  slam: (rig, startAt) => {
    playNoise(rig, { startAt, durationSeconds: 0.16, peak: 0.34, filterType: "bandpass", fromHz: 2400, toHz: 500, q: 1.1 });
    playTone(rig, { startAt, durationSeconds: 0.12, type: "triangle", fromHz: 420, toHz: 160, peak: 0.14 });
  },
  hit: (rig, startAt) => {
    playNoise(rig, { startAt, durationSeconds: 0.2, peak: 0.6, filterType: "highpass", fromHz: 1800, toHz: 4000 });
    playTone(rig, { startAt, durationSeconds: 0.16, type: "sawtooth", fromHz: 240, toHz: 70, peak: 0.35 });
  },
  // Into the roadworks: a whistle falling away down the trench. Hitting the bottom is its own
  // cue, `thud`, sounded when the picture gets there.
  fell: (rig, startAt) => {
    playTone(rig, {
      startAt,
      durationSeconds: 0.5,
      type: "sine",
      fromHz: 900,
      toHz: 120,
      peak: 0.3,
      attackSeconds: 0.03
    });
  },
  // Wiped out: three notes down, the game beat them.
  wiped: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.2, type: "triangle", fromHz: 440, peak: 0.3 });
    playTone(rig, { startAt: startAt + 0.18, durationSeconds: 0.2, type: "triangle", fromHz: 349, peak: 0.29 });
    playTone(rig, { startAt: startAt + 0.36, durationSeconds: 0.34, type: "triangle", fromHz: 262, peak: 0.28 });
  },
  // The fall's punchline, part one: the bottom of the dig. A body into gravel — a low thump, a
  // dull crunch over it, and the dust settling.
  thud: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.22, type: "sine", fromHz: 150, toHz: 48, peak: 0.5 });
    playNoise(rig, { startAt, durationSeconds: 0.16, peak: 0.5, filterType: "lowpass", fromHz: 1400, toHz: 300 });
    playNoise(rig, {
      startAt: startAt + 0.08,
      durationSeconds: 0.4,
      peak: 0.1,
      filterType: "bandpass",
      fromHz: 900,
      toHz: 600,
      q: 0.8
    });
  },
  // Part two: the raccoon, up on the lip with the handful, chittering at the hen — a run of quick
  // squeaky trills, the last one cheekier than the rest.
  chitter: (rig, startAt) => {
    for (const [index, at] of [0, 0.07, 0.14, 0.21, 0.3, 0.37].entries()) {
      const top = index === 5 ? 2600 : 2100 + (index % 2) * 250;

      playTone(rig, { startAt: startAt + at, durationSeconds: 0.05, type: "square", fromHz: top, toHz: top * 0.7, peak: 0.09 });
    }
  },
  // The wipeout's punchline: one wing into the goose. A wet crunch, short enough that five in
  // a row are a meal and not a drum roll.
  chomp: (rig, startAt) => {
    playNoise(rig, { startAt, durationSeconds: 0.08, peak: 0.5, filterType: "bandpass", fromHz: 520, toHz: 160, q: 1.4 });
    playTone(rig, { startAt, durationSeconds: 0.07, type: "square", fromHz: 190, toHz: 60, peak: 0.22 });
  },
  // And when it has eaten the lot.
  burp: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.36, type: "sawtooth", fromHz: 108, toHz: 68, peak: 0.3, attackSeconds: 0.03 });
    playTone(rig, { startAt, durationSeconds: 0.34, type: "sawtooth", fromHz: 113, toHz: 71, peak: 0.18, attackSeconds: 0.04 });
    playNoise(rig, { startAt, durationSeconds: 0.3, peak: 0.12, filterType: "lowpass", fromHz: 420, toHz: 180 });
  },
  // The post: an act-clear fanfare, three notes up and a held fifth.
  post: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.12, type: "square", fromHz: 523, peak: 0.16 });
    playTone(rig, { startAt: startAt + 0.11, durationSeconds: 0.12, type: "square", fromHz: 659, peak: 0.16 });
    playTone(rig, { startAt: startAt + 0.22, durationSeconds: 0.45, type: "square", fromHz: 784, peak: 0.18 });
    playTone(rig, { startAt: startAt + 0.22, durationSeconds: 0.45, type: "triangle", fromHz: 1047, peak: 0.12, attackSeconds: 0.05 });
  },
  // The finale: a riser under the last two chunks, a saw sweeping up with the air opening
  // over it, so the last ten seconds are the loudest thing in the run.
  riser: (rig, startAt) => {
    playTone(rig, {
      startAt,
      durationSeconds: 1.6,
      type: "sawtooth",
      fromHz: 110,
      toHz: 440,
      peak: 0.22,
      attackSeconds: 0.6
    });
    playNoise(rig, {
      startAt,
      durationSeconds: 1.6,
      peak: 0.14,
      filterType: "highpass",
      fromHz: 400,
      toHz: 3000
    });
  },
  // One wing into the bank: a tick that climbs as the count does. `intensity` is the share counted.
  bankTick: (rig, startAt, intensity) => {
    playTone(rig, {
      startAt,
      durationSeconds: 0.03,
      type: "square",
      fromHz: 1000 + intensity * 900,
      peak: 0.1
    });
  },
  // Two bright notes up: the tablet has changed hands.
  handoff: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.12, type: "triangle", fromHz: 988, peak: 0.28 });
    playTone(rig, { startAt: startAt + 0.1, durationSeconds: 0.2, type: "triangle", fromHz: 1319, peak: 0.26 });
  },
  // The team is through: an air horn, near enough.
  finish: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.7, type: "sawtooth", fromHz: 196, toHz: 392, peak: 0.32, attackSeconds: 0.25 });
    playTone(rig, { startAt, durationSeconds: 0.7, type: "sawtooth", fromHz: 294, toHz: 588, peak: 0.2, attackSeconds: 0.3 });
    playNoise(rig, { startAt, durationSeconds: 0.68, peak: 0.1, filterType: "highpass", fromHz: 800, toHz: 2200 });
  }
};

// The board's table: each cue's voice beside the gap it may repeat at.
export const SCHLONIC_CUES: CueTable<SchlonicCueName> = Object.fromEntries(
  SCHLONIC_CUE_NAMES.map((cue) => [cue, { minGapMs: SCHLONIC_CUE_MIN_GAP_MS[cue], voice: CUE_VOICES[cue] }])
) as CueTable<SchlonicCueName>;

/**
 * The pack's takes for the cues this board plays. The pack keeps takes for cues it no longer
 * has — `splash` and `squawk` from when the fall went into the bay — and a board decodes every
 * take it is handed, so those are left behind here rather than fetched and never heard.
 */
export const resolveSchlonicTakes = (takes: Readonly<Record<string, readonly string[]>>): CueTakes<SchlonicCueName> => {
  const known = new Set<string>(SCHLONIC_CUE_NAMES);

  return Object.fromEntries(Object.entries(takes).filter(([cue]) => known.has(cue))) as CueTakes<SchlonicCueName>;
};

export type SchlonicSoundboard = Soundboard<SchlonicCueName>;

export type SchlonicSoundboardOptions = Pick<
  SoundboardOptions<SchlonicCueName>,
  "createContext" | "now" | "takes" | "loadTake"
>;

export const createSchlonicSoundboard = (options: SchlonicSoundboardOptions = {}): SchlonicSoundboard =>
  createSoundboard({ cues: SCHLONIC_CUES, masterGain: SCHLONIC_MASTER_GAIN, ...options });
