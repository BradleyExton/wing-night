import { createSoundboard, type CueTable, type Soundboard, type SoundboardOptions } from "../soundboard/index.js";
import { playNoise, playTone } from "../voices/index.js";

// The house cues: the sounds that belong to the show rather than to any one
// game. The TV clock's tick and buzzer, the host tablet's chime, the two
// stings the house result card plays, and the small UI noises a turn is made
// of — a pin dropped, a clue added, a prompt sent off, a box ticked. A game
// with a voice of its own (FAPPY, JOUST, SCHLONIC) keeps its own table beside
// this one; the rest borrow from here so nine games do not grow nine pops.

export type HouseCueName =
  | "tick"
  | "timesUp"
  | "chime"
  | "hit"
  | "miss"
  | "pop"
  | "unpop"
  | "plop"
  | "scratch"
  | "whoosh"
  | "arrive"
  | "fizzle"
  | "tickOn"
  | "tickOff"
  | "go"
  | "gong"
  | "results"
  | "fanfare";

export const HOUSE_CUE_NAMES: readonly HouseCueName[] = [
  "tick",
  "timesUp",
  "chime",
  "hit",
  "miss",
  "pop",
  "unpop",
  "plop",
  "scratch",
  "whoosh",
  "arrive",
  "fizzle",
  "tickOn",
  "tickOff",
  "go",
  "gong",
  "results",
  "fanfare"
];

// How far a `pop` climbs across a board that fills up: from its lowest note to
// a fifth above it.
const POP_LOW_HZ = 520;
const POP_HIGH_HZ = 780;

// Sits under the party music rather than over it, but a tick a second has to
// read across a room, so a notch above FAPPY's board.
export const HOUSE_MASTER_GAIN = 0.3;

// One voice per cue; the numbers are a table to retune, not a system.
export const HOUSE_CUES: CueTable<HouseCueName> = {
  // A woodblock: a bright click over a short low knock, gone in 90 ms. Ten of
  // these in a row have to read as a countdown, never as an alarm.
  tick: {
    minGapMs: 250,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.05, type: "square", fromHz: 1400, toHz: 900, peak: 0.4 });
      playTone(rig, { startAt, durationSeconds: 0.09, type: "sine", fromHz: 420, toHz: 300, peak: 0.55 });
    }
  },
  // A game-show buzzer, and nothing like the tick: two saws a few hertz apart
  // beating against each other over a low square, seven hundred milliseconds
  // of it. Distinct from the host tablet's chime on purpose — the room hears
  // the buzzer, the host hears the chime, and neither is the other.
  timesUp: {
    minGapMs: 1500,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.7, type: "sawtooth", fromHz: 165, peak: 0.5, attackSeconds: 0.02 });
      playTone(rig, { startAt, durationSeconds: 0.7, type: "sawtooth", fromHz: 168, peak: 0.5, attackSeconds: 0.02 });
      playTone(rig, { startAt, durationSeconds: 0.7, type: "square", fromHz: 82, peak: 0.3, attackSeconds: 0.02 });
    }
  },
  // The host tablet's three-note time's-up chime: high, low, high, in square
  // waves. Quiet, because it plays a foot from the host's ear.
  chime: {
    minGapMs: 1500,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.18, type: "square", fromHz: 880, peak: 0.27, attackSeconds: 0.002 });
      playTone(rig, { startAt: startAt + 0.2, durationSeconds: 0.18, type: "square", fromHz: 660, peak: 0.27, attackSeconds: 0.002 });
      playTone(rig, { startAt: startAt + 0.4, durationSeconds: 0.18, type: "square", fromHz: 880, peak: 0.27, attackSeconds: 0.002 });
    }
  },
  // A correct answer: three bright notes up an arpeggio, the last one held.
  // The room should be able to hear a hit from the kitchen.
  hit: {
    minGapMs: 400,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.11, type: "triangle", fromHz: 659, peak: 0.42 });
      playTone(rig, { startAt: startAt + 0.09, durationSeconds: 0.11, type: "triangle", fromHz: 880, peak: 0.42 });
      playTone(rig, { startAt: startAt + 0.18, durationSeconds: 0.42, type: "triangle", fromHz: 1319, peak: 0.45 });
      playTone(rig, { startAt: startAt + 0.18, durationSeconds: 0.42, type: "sine", fromHz: 2637, peak: 0.12 });
    }
  },
  // A miss: a two-voice slide down half an octave, a cartoon "wah". Comic, not
  // a verdict — it has to be a punchline the table laughs at.
  miss: {
    minGapMs: 400,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.45, type: "sawtooth", fromHz: 250, toHz: 125, peak: 0.34, attackSeconds: 0.03 });
      playTone(rig, { startAt, durationSeconds: 0.45, type: "square", fromHz: 126, toHz: 62, peak: 0.2, attackSeconds: 0.03 });
    }
  },
  // Something added to a board: a bubble pop whose pitch climbs with `intensity`
  // (0..1, how full the board is), so a clue being built reads as a rising line.
  pop: {
    minGapMs: 60,
    voice: (rig, startAt, intensity) => {
      const hz = POP_LOW_HZ + (POP_HIGH_HZ - POP_LOW_HZ) * Math.min(1, Math.max(0, intensity));

      playTone(rig, { startAt, durationSeconds: 0.08, type: "sine", fromHz: hz, toHz: hz * 1.6, peak: 0.4 });
    }
  },
  // Something taken off it again: the same pop, falling.
  unpop: {
    minGapMs: 60,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.1, type: "sine", fromHz: 600, toHz: 300, peak: 0.32 });
    }
  },
  // A pin dropping into water: a soft round plop.
  plop: {
    minGapMs: 120,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.11, type: "sine", fromHz: 700, toHz: 220, peak: 0.36 });
      playNoise(rig, { startAt, durationSeconds: 0.04, peak: 0.1, filterType: "lowpass", fromHz: 900, toHz: 300 });
    }
  },
  // The needle lifted: a record scratch, a burst of noise swept down with a quick warble under it.
  scratch: {
    minGapMs: 400,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.22, peak: 0.5, filterType: "bandpass", fromHz: 2800, toHz: 300, q: 2.5 });
      playTone(rig, { startAt, durationSeconds: 0.2, type: "sawtooth", fromHz: 420, toHz: 60, peak: 0.18 });
    }
  },
  // Something sent off: a rising sweep of air.
  whoosh: {
    minGapMs: 400,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.45, peak: 0.34, filterType: "bandpass", fromHz: 300, toHz: 3200, q: 0.9 });
    }
  },
  // Something arriving: two soft bells, the second higher.
  arrive: {
    minGapMs: 400,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.3, type: "sine", fromHz: 1047, peak: 0.3, attackSeconds: 0.004 });
      playTone(rig, { startAt: startAt + 0.14, durationSeconds: 0.5, type: "sine", fromHz: 1568, peak: 0.28, attackSeconds: 0.004 });
    }
  },
  // Something that did not come off: a short fizzle down.
  fizzle: {
    minGapMs: 400,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.35, peak: 0.28, filterType: "highpass", fromHz: 4000, toHz: 800 });
      playTone(rig, { startAt, durationSeconds: 0.35, type: "square", fromHz: 300, toHz: 90, peak: 0.12 });
    }
  },
  // A box ticked: a bright wooden tick. And unticked: the same, lower.
  tickOn: {
    minGapMs: 60,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.05, type: "triangle", fromHz: 1900, toHz: 2400, peak: 0.4 });
    }
  },
  tickOff: {
    minGapMs: 60,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.06, type: "triangle", fromHz: 1200, toHz: 800, peak: 0.3 });
    }
  },
  // The count-in landing: a bright rising stab, the starting pistol the night
  // opens on.
  go: {
    minGapMs: 1500,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.35, type: "square", fromHz: 440, toHz: 880, peak: 0.3, attackSeconds: 0.01 });
      playTone(rig, { startAt, durationSeconds: 0.35, type: "sawtooth", fromHz: 660, toHz: 1320, peak: 0.18, attackSeconds: 0.01 });
      playNoise(rig, { startAt, durationSeconds: 0.3, peak: 0.16, filterType: "highpass", fromHz: 1500, toHz: 5000 });
    }
  },
  // Wings on the table: a gong, a low struck fundamental with a shimmer over it
  // that rings for a couple of seconds.
  gong: {
    minGapMs: 2000,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 2.2, type: "sine", fromHz: 110, toHz: 100, peak: 0.6, attackSeconds: 0.01 });
      playTone(rig, { startAt, durationSeconds: 1.8, type: "triangle", fromHz: 277, toHz: 262, peak: 0.22, attackSeconds: 0.01 });
      playTone(rig, { startAt, durationSeconds: 1.4, type: "sine", fromHz: 739, toHz: 700, peak: 0.12, attackSeconds: 0.01 });
      playNoise(rig, { startAt, durationSeconds: 0.12, peak: 0.3, filterType: "bandpass", fromHz: 800, toHz: 200, q: 1 });
    }
  },
  // The results landing: two low hits and a bright chord over the second, a
  // game show's "and the scores are in".
  results: {
    minGapMs: 1500,
    voice: (rig, startAt) => {
      for (const hitAt of [0, 0.22]) {
        playTone(rig, { startAt: startAt + hitAt, durationSeconds: 0.18, type: "sine", fromHz: 130, toHz: 60, peak: 0.6 });
        playNoise(rig, { startAt: startAt + hitAt, durationSeconds: 0.06, peak: 0.3, filterType: "lowpass", fromHz: 1200, toHz: 300 });
      }
      for (const hz of [523, 659, 784]) {
        playTone(rig, { startAt: startAt + 0.22, durationSeconds: 0.7, type: "triangle", fromHz: hz, peak: 0.16, attackSeconds: 0.02 });
      }
    }
  },
  // A champion: a proper fanfare, four notes up and a held major chord with a
  // breath of air over it, two seconds of it.
  fanfare: {
    minGapMs: 3000,
    voice: (rig, startAt) => {
      const notes = [392, 523, 659, 784];

      notes.forEach((hz, index) => {
        playTone(rig, { startAt: startAt + index * 0.16, durationSeconds: 0.2, type: "sawtooth", fromHz: hz, peak: 0.22, attackSeconds: 0.02 });
        playTone(rig, { startAt: startAt + index * 0.16, durationSeconds: 0.2, type: "square", fromHz: hz / 2, peak: 0.1, attackSeconds: 0.02 });
      });
      for (const hz of [784, 988, 1175, 1568]) {
        playTone(rig, { startAt: startAt + 0.64, durationSeconds: 1.4, type: "sawtooth", fromHz: hz, peak: 0.13, attackSeconds: 0.05 });
      }
      playTone(rig, { startAt: startAt + 0.64, durationSeconds: 1.4, type: "sine", fromHz: 98, peak: 0.4, attackSeconds: 0.05 });
      playNoise(rig, { startAt: startAt + 0.64, durationSeconds: 1.2, peak: 0.1, filterType: "highpass", fromHz: 2500, toHz: 6000 });
    }
  }
};

export type HouseSoundboard = Soundboard<HouseCueName>;

export type HouseSoundboardOptions = Pick<SoundboardOptions<HouseCueName>, "createContext" | "now">;

export const createHouseSoundboard = (options: HouseSoundboardOptions = {}): HouseSoundboard =>
  createSoundboard({ cues: HOUSE_CUES, masterGain: HOUSE_MASTER_GAIN, ...options });
