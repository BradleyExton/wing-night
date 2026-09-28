import { createSoundboard, type CueTable, type Soundboard, type SoundboardOptions } from "../soundboard/index.js";
import { playTone } from "../voices/index.js";

// The house cues: the sounds that belong to the show rather than to any one
// game. The TV clock's tick and buzzer, the host tablet's chime, and the two
// stings the house result card plays. A game with sounds of its own (FAPPY)
// keeps its own table beside this one; a game with none gets these for free
// through the shared components that play them.

export type HouseCueName = "tick" | "timesUp" | "chime" | "hit" | "miss";

export const HOUSE_CUE_NAMES: readonly HouseCueName[] = ["tick", "timesUp", "chime", "hit", "miss"];

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
  }
};

export type HouseSoundboard = Soundboard<HouseCueName>;

export type HouseSoundboardOptions = Pick<SoundboardOptions<HouseCueName>, "createContext" | "now">;

export const createHouseSoundboard = (options: HouseSoundboardOptions = {}): HouseSoundboard =>
  createSoundboard({ cues: HOUSE_CUES, masterGain: HOUSE_MASTER_GAIN, ...options });
