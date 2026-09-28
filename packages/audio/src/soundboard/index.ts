import { createNoiseBuffer, type CueRig } from "../voices/index.js";

// The house's one way to make a noise: a cue table played through a board.
//
// A board is a named table of voices with a master gain, and a `play(cue)`
// that never throws. It grew out of FAPPY's soundboard and the TV clock's
// copy of it — two byte-alike modules that each owned an AudioContext — and
// the rules they had each learned are the rules here:
//
// ONE AudioContext per tab, made on the first cue and never closed. Contexts
// are a scarce per-tab resource and each one costs a hardware stream; the
// lobby's beat clock also learned that closing a context can mute the room.
// Every board in the show shares this one, whichever package made the board.
//
// Two buses between the boards and the speaker. Every effect leaves through
// `sfx`; a spoken line (the announcer in BACKLOG.md) will leave through
// `voice`. A bus is a gain node, so the room can turn all of one kind down
// without touching the other — and without any board knowing.
//
// Every cue is best-effort. No `AudioContext`, one the room has not unlocked
// yet (the display's `AudioUnlockOverlay` tap is what resumes it), a context
// that refuses to start under a headless Playwright run: all of them are
// SILENCE, never an exception, and the next cue tries again. Nothing on a
// board may break the picture.
//
// The TV's master music volume is deliberately NOT applied here. That volume
// lives in the room's `musicPlayback` state and reaches the display's single
// `<audio>` element; a minigame renderer is handed props that carry no
// volume, and reaching around them into app state would break the minigame
// boundary (AGENTS.md §3.1). A board runs at its own fixed, modest master
// gain, tuned to sit under the party music rather than over it.

export type AudioBus = "sfx" | "voice";

// `intensity` is 0..1; most voices ignore it. FAPPY's heartbeat swells on it.
export type CueVoice = (rig: CueRig, startAt: number, intensity: number) => void;

export type CueSpec = {
  // The shortest gap between two soundings of the same cue. A guard, not a
  // rate limiter: two renders landing on one moment must be one sound, and a
  // mirror that re-simulates a run could otherwise stack a cue on itself in a
  // single frame. Different cues never gate each other.
  minGapMs: number;
  voice: CueVoice;
};

export type CueTable<Name extends string> = Record<Name, CueSpec>;

export type Soundboard<Name extends string> = {
  // Sound a cue now. Never throws: a missing, blocked or still-suspended
  // context is silence, and the next cue tries again.
  play: (cue: Name, intensity?: number) => void;
};

export type AudioContextFactory = () => AudioContext | null;

export type SoundboardOptions<Name extends string> = {
  cues: CueTable<Name>;
  // Where the whole board sits, 0..1, before its bus.
  masterGain: number;
  bus?: AudioBus;
  // Injected in tests; the AudioContext itself is not unit-testable.
  createContext?: AudioContextFactory;
  now?: () => number;
};

// Pure: whether a cue last sounded long enough ago to sound again.
export const isCueDue = (
  lastPlayedAtMs: number | null,
  nowMs: number,
  minGapMs: number
): boolean => lastPlayedAtMs === null || nowMs - lastPlayedAtMs >= minGapMs;

type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let sharedContext: AudioContext | null = null;

const resolveSharedContext: AudioContextFactory = () => {
  if (sharedContext !== null) {
    return sharedContext;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextConstructor =
    window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext;

  if (AudioContextConstructor === undefined) {
    return null;
  }

  try {
    sharedContext = new AudioContextConstructor();
  } catch {
    // A browser that refuses to hand one out just means a silent room.
    return null;
  }

  return sharedContext;
};

// Make the tab's context inside a user gesture and ask it to run. The
// display's unlock overlay calls this on its tap, so the first cue of the
// night — which may land in an effect, outside any gesture — finds a context
// already awake. Best-effort: a browser with no AudioContext is silence, and
// every board still resumes on every cue for the tab that suspends later.
export const wakeAudio = (): void => {
  const context = resolveSharedContext();

  if (context === null) {
    return;
  }

  try {
    void Promise.resolve(context.resume()).catch(() => undefined);
  } catch {
    // Silence.
  }
};

// The bus levels are remembered here rather than read off the nodes, so a
// level set before the first cue still applies when the buses are made.
const busLevels: Record<AudioBus, number> = { sfx: 1, voice: 1 };

type BusRack = Record<AudioBus, GainNode>;

const racks = new WeakMap<AudioContext, BusRack>();

const createBus = (context: AudioContext, bus: AudioBus): GainNode => {
  const node = context.createGain();

  node.gain.setValueAtTime(busLevels[bus], context.currentTime);
  node.connect(context.destination);

  return node;
};

const resolveRack = (context: AudioContext): BusRack => {
  const existing = racks.get(context);

  if (existing !== undefined) {
    return existing;
  }

  const rack: BusRack = {
    sfx: createBus(context, "sfx"),
    voice: createBus(context, "voice")
  };

  racks.set(context, rack);

  return rack;
};

// The room's level for one bus, 0..1. Applies to every board on it at once,
// now and for boards made later. Best-effort like everything else here.
export const setAudioBusLevel = (bus: AudioBus, level: number): void => {
  const clamped = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : busLevels[bus];

  busLevels[bus] = clamped;

  if (sharedContext === null) {
    return;
  }

  try {
    resolveRack(sharedContext)[bus].gain.setValueAtTime(clamped, sharedContext.currentTime);
  } catch {
    // A detached context is silence anyway.
  }
};

// The one noise buffer per context, shared by every board on it.
const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();

const resolveNoise = (context: AudioContext): AudioBuffer => {
  const existing = noiseBuffers.get(context);

  if (existing !== undefined) {
    return existing;
  }

  const noise = createNoiseBuffer(context);

  noiseBuffers.set(context, noise);

  return noise;
};

export const createSoundboard = <Name extends string>(
  options: SoundboardOptions<Name>
): Soundboard<Name> => {
  const createContext = options.createContext ?? resolveSharedContext;
  const now = options.now ?? ((): number => Date.now());
  const bus = options.bus ?? "sfx";
  const lastPlayedAtMs = new Map<Name, number>();
  // The board's master and noise, made once per context and reused by every
  // cue. Keyed on the context because a test hands in its own.
  let rig: CueRig | null = null;

  const resolveRig = (context: AudioContext): CueRig => {
    if (rig !== null && rig.context === context) {
      return rig;
    }

    const out = context.createGain();

    out.gain.setValueAtTime(options.masterGain, context.currentTime);
    out.connect(resolveRack(context)[bus]);
    rig = { context, out, noise: resolveNoise(context) };

    return rig;
  };

  const play = (cue: Name, intensity = 1): void => {
    try {
      const atMs = now();

      if (!isCueDue(lastPlayedAtMs.get(cue) ?? null, atMs, options.cues[cue].minGapMs)) {
        return;
      }

      const context = createContext();

      if (context === null) {
        return;
      }

      // Resume on every cue, not once: the room taps the display's unlock
      // overlay at some point we are not told about, and a tab that goes to
      // the background suspends again.
      if (context.state !== "running") {
        void Promise.resolve(context.resume()).catch(() => undefined);

        // Still not running. Scheduling into a suspended context would queue
        // the cue and dump the backlog at once when it wakes, so drop it: the
        // next cue tries again.
        return;
      }

      lastPlayedAtMs.set(cue, atMs);
      // A hair in the future, because a node started exactly at `currentTime`
      // can click.
      options.cues[cue].voice(resolveRig(context), context.currentTime + 0.002, intensity);
    } catch {
      // Best-effort: audio must never break the stage, a rAF loop or a
      // headless test run.
    }
  };

  return { play };
};
