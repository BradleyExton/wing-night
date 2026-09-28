import {
  createSoundboard,
  playNoise,
  playTone,
  type CueTable,
  type Soundboard,
  type SoundboardOptions
} from "@wingnight/audio";
import type { JoustMinigameShot } from "@wingnight/shared";

/**
 * JOUST's cue table on the house board (`@wingnight/audio`): the slingshot, the pins and the
 * scaffolding, synthesised. The TV's table, not the tablet's — the display is the room's
 * speaker — so only `DisplayJoustSurface` wires it up, through `useJoustSounds`.
 */
export type JoustCueName = "creak" | "launch" | "topple" | "collapse" | "rackCleared";

export const JOUST_CUE_NAMES: readonly JoustCueName[] = [
  "creak",
  "launch",
  "topple",
  "collapse",
  "rackCleared"
];

// The pack folder its recorded takes live in: `assets/sfx/joust/topple-1.mp3` is a take of
// `topple`. A cue with none keeps the synthesis below.
export const JOUST_SFX_FOLDER = "joust";

// Under the party music, like FAPPY's.
export const JOUST_MASTER_GAIN = 0.25;

// The pull a band has to move by, as a fraction of its radius, before it creaks again. Under
// this the tablet's pointer is settling, not pulling, and a creak a snapshot would be a rattle.
export const CREAK_PULL_STEP = 0.06;

/**
 * Pure: whether a change of aim is a pull worth a creak, and how hard the band is drawn. Only a
 * pull BACK creaks — easing off is silent, and letting go is the launch, which is the shot's.
 * `null` on the first reading, so a display that mounts on a half-drawn band says nothing.
 */
export const resolveCreak = (
  previousMagnitude: number | null,
  magnitude: number
): { intensity: number } | null => {
  if (previousMagnitude === null || !Number.isFinite(magnitude)) {
    return null;
  }

  if (magnitude - previousMagnitude < CREAK_PULL_STEP) {
    return null;
  }

  return { intensity: Math.min(1, Math.max(0, magnitude)) };
};

export type JoustReplayCue = {
  cue: "topple" | "collapse";
  frameIndex: number;
};

/**
 * Pure: the impacts the replay crossed between the last whole keyframe it had reached and the
 * one it has reached now, in frame order. The same reading `resolveJoustScene` bursts on —
 * `(previous, reached]` — so the room hears a pin go over on the frame it sees it.
 */
export const resolveReplayCues = (
  shot: Pick<JoustMinigameShot, "run">,
  previousReachedIndex: number,
  reachedIndex: number
): JoustReplayCue[] => {
  if (reachedIndex <= previousReachedIndex) {
    return [];
  }

  const cues: JoustReplayCue[] = [];

  for (const topple of shot.run.topples) {
    if (topple.frameIndex > previousReachedIndex && topple.frameIndex <= reachedIndex) {
      cues.push({ cue: "topple", frameIndex: topple.frameIndex });
    }
  }

  for (const collapse of shot.run.collapses) {
    if (collapse.frameIndex > previousReachedIndex && collapse.frameIndex <= reachedIndex) {
      cues.push({ cue: "collapse", frameIndex: collapse.frameIndex });
    }
  }

  return cues.sort((left, right) => left.frameIndex - right.frameIndex);
};

const CREAK_LOW_HZ = 90;
const CREAK_HIGH_HZ = 260;

export const JOUST_CUES: CueTable<JoustCueName> = {
  // The band drawing back: a short rubbery creak whose pitch climbs with the pull.
  creak: {
    minGapMs: 90,
    voice: (rig, startAt, intensity) => {
      const hz = CREAK_LOW_HZ + (CREAK_HIGH_HZ - CREAK_LOW_HZ) * intensity;

      playTone(rig, { startAt, durationSeconds: 0.07, type: "sawtooth", fromHz: hz, toHz: hz * 1.3, peak: 0.12 });
      playNoise(rig, { startAt, durationSeconds: 0.05, peak: 0.08, filterType: "bandpass", fromHz: 900, q: 3 });
    }
  },
  // Letting go: a twang and the whoosh of the shot leaving.
  launch: {
    minGapMs: 300,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.16, type: "sawtooth", fromHz: 240, toHz: 90, peak: 0.36 });
      playTone(rig, { startAt, durationSeconds: 0.12, type: "square", fromHz: 480, toHz: 180, peak: 0.14 });
      playNoise(rig, { startAt: startAt + 0.02, durationSeconds: 0.35, peak: 0.28, filterType: "bandpass", fromHz: 400, toHz: 2600, q: 0.8 });
    }
  },
  // A pin going over: a wooden clack. Several in a row is a pile-up, so it must stay short.
  topple: {
    minGapMs: 50,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.05, peak: 0.55, filterType: "bandpass", fromHz: 2200, toHz: 900, q: 1.4 });
      playTone(rig, { startAt, durationSeconds: 0.09, type: "triangle", fromHz: 520, toHz: 260, peak: 0.4 });
    }
  },
  // Timber: the scaffolding folding, a low rumble under a crack.
  collapse: {
    minGapMs: 200,
    voice: (rig, startAt) => {
      playNoise(rig, { startAt, durationSeconds: 0.08, peak: 0.6, filterType: "highpass", fromHz: 1500, toHz: 4000 });
      playNoise(rig, { startAt: startAt + 0.04, durationSeconds: 0.6, peak: 0.7, filterType: "lowpass", fromHz: 400, toHz: 80 });
      playTone(rig, { startAt: startAt + 0.04, durationSeconds: 0.55, type: "sine", fromHz: 70, toHz: 32, peak: 0.6, attackSeconds: 0.03 });
    }
  },
  // Nobody left standing: a rising fanfare, three notes and a held chord, the only bonus in the game.
  rackCleared: {
    minGapMs: 1500,
    voice: (rig, startAt) => {
      const notes = [392, 494, 587];

      notes.forEach((hz, index) => {
        playTone(rig, { startAt: startAt + index * 0.12, durationSeconds: 0.14, type: "square", fromHz: hz, peak: 0.22 });
      });
      for (const hz of [784, 988, 1175]) {
        playTone(rig, { startAt: startAt + 0.36, durationSeconds: 0.7, type: "sawtooth", fromHz: hz, peak: 0.14, attackSeconds: 0.04 });
      }
      playNoise(rig, { startAt: startAt + 0.36, durationSeconds: 0.6, peak: 0.08, filterType: "highpass", fromHz: 2000, toHz: 5000 });
    }
  }
};

export type JoustSoundboard = Soundboard<JoustCueName>;

export type JoustSoundboardOptions = Pick<
  SoundboardOptions<JoustCueName>,
  "createContext" | "now" | "takes" | "loadTake"
>;

export const createJoustSoundboard = (options: JoustSoundboardOptions = {}): JoustSoundboard =>
  createSoundboard({ cues: JOUST_CUES, masterGain: JOUST_MASTER_GAIN, ...options });
