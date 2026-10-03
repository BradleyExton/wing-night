import {
  createSoundboard,
  playNoise,
  playTone,
  type CueTable,
  type CueVoice,
  type Soundboard,
  type SoundboardOptions
} from "@wingnight/audio";

/**
 * Mount Your Hens' soundboard (spec §0.7): the climb's noises as a table of voices for the house
 * board (`@wingnight/audio`). The TV's board, never the tablet's: the display is the room's
 * speaker. Best-effort and silent when it cannot sound.
 */
export type MountCueName = "grab" | "slip" | "thud" | "mount" | "time";

export const MOUNT_CUE_NAMES: readonly MountCueName[] = ["grab", "slip", "thud", "mount", "time"];

// The pack folder its recorded takes live in: `assets/sfx/mount/grab-1.mp3` is a take of `grab`.
export const MOUNT_SFX_FOLDER = "mount";

// Under a party playlist: a grab is a tick, never a nag, however fast the climber works.
export const MOUNT_MASTER_GAIN = 0.25;

/**
 * The shortest gap between two soundings of the same cue. `grab` is the tightest: two thumbs let
 * go at once and both should be heard. The endings are told once a climb.
 */
export const MOUNT_CUE_MIN_GAP_MS: Record<MountCueName, number> = {
  grab: 50,
  slip: 80,
  thud: 400,
  mount: 1500,
  time: 1500
};

// One voice per cue. The numbers are a table to retune, not a system.
const CUE_VOICES: Record<MountCueName, CueVoice> = {
  // A limb sticking: a short dry knock, a blip of pitch on a flick of noise.
  grab: (rig, startAt) => {
    playNoise(rig, { startAt, durationSeconds: 0.03, peak: 0.35, filterType: "bandpass", fromHz: 3200, toHz: 2200, q: 1.6 });
    playTone(rig, { startAt, durationSeconds: 0.05, type: "triangle", fromHz: 1100, toHz: 760, peak: 0.18 });
  },
  // A hold let go: a falling squeak, the limb peeling off.
  slip: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.12, type: "triangle", fromHz: 900, toHz: 380, peak: 0.16 });
    playNoise(rig, { startAt, durationSeconds: 0.06, peak: 0.12, filterType: "highpass", fromHz: 2400 });
  },
  // The floor: a low body thump with a crunch of noise on it.
  thud: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.26, type: "sine", fromHz: 130, toHz: 42, peak: 0.55 });
    playNoise(rig, { startAt, durationSeconds: 0.16, peak: 0.38, filterType: "lowpass", fromHz: 900, toHz: 200 });
  },
  // The line moves: a bright climbing fanfare, three notes and a held fourth.
  mount: (rig, startAt) => {
    for (const [index, hz] of [523, 659, 784].entries()) {
      playTone(rig, { startAt: startAt + index * 0.09, durationSeconds: 0.12, type: "square", fromHz: hz, peak: 0.12 });
    }

    playTone(rig, { startAt: startAt + 0.27, durationSeconds: 0.5, type: "triangle", fromHz: 1047, peak: 0.26 });
    playTone(rig, { startAt: startAt + 0.27, durationSeconds: 0.45, type: "sine", fromHz: 2093, peak: 0.07 });
  },
  // The clock at nought: a referee's whistle, a trill on a high tone.
  time: (rig, startAt) => {
    playTone(rig, { startAt, durationSeconds: 0.5, type: "sine", fromHz: 2700, toHz: 2550, peak: 0.22, attackSeconds: 0.01 });
    playNoise(rig, { startAt, durationSeconds: 0.5, peak: 0.08, filterType: "bandpass", fromHz: 2700, q: 6 });
  }
};

// The board's table: each cue's voice beside the gap it may repeat at.
export const MOUNT_CUES: CueTable<MountCueName> = Object.fromEntries(
  MOUNT_CUE_NAMES.map((cue) => [cue, { minGapMs: MOUNT_CUE_MIN_GAP_MS[cue], voice: CUE_VOICES[cue] }])
) as CueTable<MountCueName>;

export type MountSoundboard = Soundboard<MountCueName>;

export type MountSoundboardOptions = Pick<SoundboardOptions<MountCueName>, "createContext" | "now" | "takes" | "loadTake">;

export const createMountSoundboard = (options: MountSoundboardOptions = {}): MountSoundboard =>
  createSoundboard({ cues: MOUNT_CUES, masterGain: MOUNT_MASTER_GAIN, ...options });
