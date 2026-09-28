import type { CueRig } from "../voices/index.js";

// The third instrument: a recorded take. A cue that has takes in the pack
// plays one of them instead of its synthesised voice — the synthesis stays as
// the fallback for a cue nobody recorded, a take still on its way down the
// wire, and a file the browser could not decode.
//
// Takes are decoded once per context and URL and cached here, like the noise
// buffer, so every board that names the same file shares the one buffer.

export type TakeLoader = (context: AudioContext, url: string) => Promise<AudioBuffer>;

export type TakeSpec = {
  startAt: number;
  buffer: AudioBuffer;
  peak: number;
  playbackRate: number;
};

type TakeState = AudioBuffer | "loading" | "failed";

// The same take played twice in a row is the tell that it is a recording, so a
// board steps through its takes AND through these rates, a few percent either
// side of true. A fixed walk rather than Math.random: nothing in the house's
// audio is a source of nondeterminism.
export const TAKE_PLAYBACK_RATES: readonly number[] = [1, 0.94, 1.05, 0.97, 1.03];

export const fetchTake: TakeLoader = async (context, url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Take ${url} answered ${response.status}.`);
  }

  return context.decodeAudioData(await response.arrayBuffer());
};

const takeStates = new WeakMap<AudioContext, Map<string, TakeState>>();

const resolveTakeStates = (context: AudioContext): Map<string, TakeState> => {
  const existing = takeStates.get(context);

  if (existing !== undefined) {
    return existing;
  }

  const states = new Map<string, TakeState>();

  takeStates.set(context, states);

  return states;
};

// Start decoding any of these takes this context has not seen. Idempotent and
// never throws: a take that fails is remembered as failed and never retried,
// so a missing file costs one request, not one per cue.
export const loadTakes = (
  context: AudioContext,
  urls: readonly string[],
  loader: TakeLoader = fetchTake
): void => {
  const states = resolveTakeStates(context);

  for (const url of urls) {
    if (states.has(url)) {
      continue;
    }

    states.set(url, "loading");

    try {
      loader(context, url).then(
        (buffer) => {
          states.set(url, buffer);
        },
        () => {
          states.set(url, "failed");
        }
      );
    } catch {
      states.set(url, "failed");
    }
  }
};

// The takes of these that are decoded and ready, in the order given.
export const resolveLoadedTakes = (
  context: AudioContext,
  urls: readonly string[]
): AudioBuffer[] => {
  const states = resolveTakeStates(context);
  const loaded: AudioBuffer[] = [];

  for (const url of urls) {
    const state = states.get(url);

    if (state !== undefined && state !== "loading" && state !== "failed") {
      loaded.push(state);
    }
  }

  return loaded;
};

export const playTake = (rig: CueRig, spec: TakeSpec): void => {
  const { context } = rig;
  const source = context.createBufferSource();
  const gain = context.createGain();

  source.buffer = spec.buffer;
  source.playbackRate.setValueAtTime(spec.playbackRate, spec.startAt);
  gain.gain.setValueAtTime(Math.max(0, spec.peak), spec.startAt);

  source.connect(gain);
  gain.connect(rig.out);
  source.start(spec.startAt);
};
