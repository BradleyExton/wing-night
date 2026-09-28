import {
  createSoundboard,
  playNoise,
  playTone,
  type CueTable,
  type Soundboard,
  type SoundboardOptions
} from "@wingnight/audio";

/**
 * SCHLONIC's cue table on the house board (`@wingnight/audio`): a Sonic zone's noises, synthesised.
 * The TV's table, not the tablet's — the display is the room's speaker — so only
 * `DisplaySchlonicSurface` wires it up, through `useSchlonicSounds`.
 */
export type SchlonicCueName =
  | "jump"
  | "spring"
  | "land"
  | "wing"
  | "badnik"
  | "hit"
  | "cleared"
  | "wipeout"
  | "fall";

export const SCHLONIC_CUE_NAMES: readonly SchlonicCueName[] = [
  "jump",
  "spring",
  "land",
  "wing",
  "badnik",
  "hit",
  "cleared",
  "wipeout",
  "fall"
];

// Under the party music, like FAPPY's: a zone full of wings is a lot of dings.
export const SCHLONIC_MASTER_GAIN = 0.25;

// How many wings in hand take the wing's ding from its lowest note to its highest. The pitch
// climbing with the handful is the whole feedback: the room hears the run getting richer.
export const WING_PITCH_HANDFUL = 12;

/** Pure: wings in hand into the 0..1 the wing cue climbs on. */
export const resolveWingPitch = (wingsInHand: number): number => {
  if (!Number.isFinite(wingsInHand) || wingsInHand <= 0) {
    return 0;
  }

  return Math.min(1, wingsInHand / WING_PITCH_HANDFUL);
};

const WING_LOW_HZ = 1175;
const WING_HIGH_HZ = 2349;

export const SCHLONIC_CUES: CueTable<SchlonicCueName> = {
  // A boing: a short rising blip, the cartoon spring under a jump.
  jump: {
    minGapMs: 80,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.12, type: "square", fromHz: 330, toHz: 660, peak: 0.22 });
    }
  },
  // The springboard: a longer, higher boing with a twang of air in it.
  spring: {
    minGapMs: 200,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.28, type: "square", fromHz: 220, toHz: 1320, peak: 0.3 });
      playNoise(rig, { startAt, durationSeconds: 0.15, peak: 0.12, filterType: "bandpass", fromHz: 600, toHz: 2400, q: 1.5 });
    }
  },
  // Feet on the ground: a soft, low pat. Quiet, because the zone is bumpy.
  land: {
    minGapMs: 120,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.05, peak: 0.14, filterType: "lowpass", fromHz: 500, toHz: 150 });
    }
  },
  // The ring: a bright ding that climbs a whole octave with the handful (`resolveWingPitch`).
  wing: {
    minGapMs: 40,
    voice: (rig, startAt, intensity) => {
      const hz = WING_LOW_HZ + (WING_HIGH_HZ - WING_LOW_HZ) * intensity;

      playTone(rig, { startAt, durationSeconds: 0.09, type: "triangle", fromHz: hz, peak: 0.28 });
      playTone(rig, { startAt, durationSeconds: 0.14, type: "sine", fromHz: hz * 2, peak: 0.1 });
    }
  },
  // A badnik popped underfoot: a pop and a bounce.
  badnik: {
    minGapMs: 80,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.08, peak: 0.4, filterType: "bandpass", fromHz: 1200, toHz: 400, q: 1 });
      playTone(rig, { startAt: startAt + 0.03, durationSeconds: 0.14, type: "square", fromHz: 200, toHz: 500, peak: 0.16 });
    }
  },
  // Wings scattering: a harsh burst and a spray of little dings falling away.
  hit: {
    minGapMs: 200,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.2, peak: 0.5, filterType: "highpass", fromHz: 1200, toHz: 3000 });
      for (let index = 0; index < 5; index += 1) {
        playTone(rig, {
          startAt: startAt + 0.04 + index * 0.05,
          durationSeconds: 0.06,
          type: "triangle",
          fromHz: 2200 - index * 220,
          peak: 0.16
        });
      }
    }
  },
  // The goal line: a quick four-note run up and a held top, a stage-clear jingle.
  cleared: {
    minGapMs: 1500,
    voice: (rig, startAt) => {
      const notes = [523, 659, 784, 1047];

      notes.forEach((hz, index) => {
        playTone(rig, {
          startAt: startAt + index * 0.11,
          durationSeconds: index === notes.length - 1 ? 0.5 : 0.12,
          type: "square",
          fromHz: hz,
          peak: index === notes.length - 1 ? 0.3 : 0.24
        });
      });
      playTone(rig, { startAt: startAt + 0.33, durationSeconds: 0.5, type: "triangle", fromHz: 1568, peak: 0.12 });
    }
  },
  // Wiped out: a crunch and a slow slide down.
  wipeout: {
    minGapMs: 1500,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.25, peak: 0.6, filterType: "lowpass", fromHz: 3000, toHz: 200 });
      playTone(rig, { startAt: startAt + 0.1, durationSeconds: 0.6, type: "sawtooth", fromHz: 300, toHz: 70, peak: 0.3, attackSeconds: 0.05 });
    }
  },
  // Into the pit: a long falling whistle and a distant thud at the bottom.
  fall: {
    minGapMs: 1500,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.7, type: "sine", fromHz: 1400, toHz: 200, peak: 0.26, attackSeconds: 0.03 });
      playTone(rig, { startAt: startAt + 0.7, durationSeconds: 0.18, type: "sine", fromHz: 120, toHz: 40, peak: 0.5 });
    }
  }
};

export type SchlonicSoundboard = Soundboard<SchlonicCueName>;

export type SchlonicSoundboardOptions = Pick<SoundboardOptions<SchlonicCueName>, "createContext" | "now">;

export const createSchlonicSoundboard = (options: SchlonicSoundboardOptions = {}): SchlonicSoundboard =>
  createSoundboard({ cues: SCHLONIC_CUES, masterGain: SCHLONIC_MASTER_GAIN, ...options });
