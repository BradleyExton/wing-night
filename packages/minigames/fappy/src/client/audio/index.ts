import {
  createSoundboard,
  playNoise,
  playTone,
  type CueTable,
  type Soundboard,
  type SoundboardOptions
} from "@wingnight/audio";

/**
 * FAPPY's cue table: every noise the corridor makes, as voices on the house board
 * (`@wingnight/audio`). The board owns the one AudioContext, the bus, the best-effort rule and
 * the per-cue gap; this module owns only what FAPPY sounds like.
 *
 * It is the TV's table, not the tablet's: the display is the room's speaker (the host tablet
 * sits on a table and is barely audible), so only `DisplayFappySurface` ever wires it up.
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

/**
 * One voice per cue. Durations are the spec's; the numbers are a table to retune, not a system.
 * The gaps are not rate limiters for their own sake: `handoff` is told twice on purpose (the
 * mirror's replay lands, and the surface's leg hold starts, a beat apart) and the room must hear
 * one ding, and a mirror that re-simulates a run from the top could otherwise stack a cue on
 * itself in a single frame.
 */
export const FAPPY_CUES: CueTable<FappyCueName> = {
  // A soft fwip of air, not a click: a band of noise sliding down, over in 60 ms. It fires ten
  // times a second at full mash, so it has to be the quietest thing on the board bar the gate.
  flap: {
    minGapMs: 45,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.06, peak: 0.16, filterType: "bandpass", fromHz: 1500, toHz: 700, q: 1.2 });
    }
  },
  // A splat and a thud together: the sand takes the bird.
  crash: {
    minGapMs: 200,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.22, peak: 0.9, filterType: "lowpass", fromHz: 2400, toHz: 300 });
      playTone(rig, { startAt, durationSeconds: 0.25, type: "sine", fromHz: 150, toHz: 45, peak: 0.85 });
    }
  },
  // An eagle's shove or a glob landing: a short wet squelch, no low end, nothing fatal about it.
  bump: {
    minGapMs: 90,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.13, type: "sawtooth", fromHz: 320, toHz: 90, peak: 0.45 });
      playNoise(rig, { startAt, durationSeconds: 0.09, peak: 0.25, filterType: "bandpass", fromHz: 900, toHz: 300, q: 2 });
    }
  },
  // The quietest cue on the board by a distance. Thirty-two of these across a turn should read
  // as a rhythm picking up, never as an alarm.
  gateCleared: {
    minGapMs: 80,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.04, type: "triangle", fromHz: 1600, toHz: 2100, peak: 0.055 });
    }
  },
  // Two bright notes up: the tablet has changed hands.
  handoff: {
    minGapMs: 900,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.12, type: "triangle", fromHz: 988, peak: 0.28 });
      playTone(rig, { startAt: startAt + 0.1, durationSeconds: 0.2, type: "triangle", fromHz: 1319, peak: 0.26 });
    }
  },
  // An air horn, near enough: two detuned saws swelling a fifth apart with a breath of air
  // over them, seven hundred milliseconds of it.
  finish: {
    minGapMs: 1500,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.7, type: "sawtooth", fromHz: 196, toHz: 392, peak: 0.32, attackSeconds: 0.25 });
      playTone(rig, { startAt, durationSeconds: 0.7, type: "sawtooth", fromHz: 294, toHz: 588, peak: 0.2, attackSeconds: 0.3 });
      playNoise(rig, { startAt, durationSeconds: 0.68, peak: 0.1, filterType: "highpass", fromHz: 800, toHz: 2200 });
    }
  },
  // Three notes down: the clock beat them.
  timedOut: {
    minGapMs: 1500,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.22, type: "triangle", fromHz: 440, peak: 0.3 });
      playTone(rig, { startAt: startAt + 0.2, durationSeconds: 0.22, type: "triangle", fromHz: 349, peak: 0.29 });
      playTone(rig, { startAt: startAt + 0.4, durationSeconds: 0.36, type: "triangle", fromHz: 262, peak: 0.28 });
    }
  },
  // A metronome's click, once a second past par.
  tick: {
    minGapMs: 250,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.025, type: "square", fromHz: 1200, peak: 0.11 });
    }
  },
  // Low double thump. `intensity` is the 0..1 urgency; it gets louder as the limit closes.
  heartbeat: {
    minGapMs: 250,
    voice: (rig, startAt, intensity) => {
      const gain = resolveHeartbeatGain(intensity);

      playTone(rig, { startAt, durationSeconds: 0.13, type: "sine", fromHz: 90, toHz: 38, peak: 0.55 * gain });
      playTone(rig, { startAt: startAt + 0.2, durationSeconds: 0.16, type: "sine", fromHz: 78, toHz: 34, peak: 0.42 * gain });
    }
  }
};

export type FappySoundboard = Soundboard<FappyCueName>;

// The pack folder its recorded takes live in: `assets/sfx/fappy/crash-1.mp3` is a take of `crash`.
// A cue with none keeps its synthesis.
export const FAPPY_SFX_FOLDER = "fappy";

export type FappySoundboardOptions = Pick<
  SoundboardOptions<FappyCueName>,
  "createContext" | "now" | "takes" | "loadTake"
>;

export const createFappySoundboard = (options: FappySoundboardOptions = {}): FappySoundboard =>
  createSoundboard({ cues: FAPPY_CUES, masterGain: FAPPY_MASTER_GAIN, ...options });
