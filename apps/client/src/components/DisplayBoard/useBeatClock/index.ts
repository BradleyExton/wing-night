import { useEffect, type RefObject } from "react";

import { createBeatClock } from "../../../utils/createBeatClock";

// The display's one beat: taps the `<audio>` the music cue plays through,
// asks `createBeatClock` on every animation frame whether that was a kick,
// and flips `data-beat` on the display root each time it was. Dancing birds
// (the cast's `dance` pose) answer that attribute through a CSS transition,
// so a hundred parts move on the beat without a React render between them.
//
// The graph is built ONCE per element and never torn down: a media element
// can be tapped exactly once for its lifetime, and once it is, its sound only
// reaches the speaker through the graph — closing the context would mute the
// room. So the map remembers the graph and a re-run of the effect finds it.
type AnalyserGraph = {
  analyser: AnalyserNode;
  bins: Uint8Array<ArrayBuffer>;
};

const graphByMedia = new WeakMap<HTMLMediaElement, AnalyserGraph>();

// 1024 bins over the sample rate puts the first ones under ~300 Hz, which is
// where a kick drum lives; the sum of those is the "low band energy".
const FFT_SIZE = 1024;
const LOW_BAND_FIRST_BIN = 1;
const LOW_BAND_LAST_BIN = 6;

const attachAnalyser = (media: HTMLMediaElement): AnalyserGraph | null => {
  const existing = graphByMedia.get(media);

  if (existing !== undefined) {
    return existing;
  }

  try {
    const context = new AudioContext();
    const source = context.createMediaElementSource(media);
    const analyser = context.createAnalyser();

    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.35;
    source.connect(analyser);
    analyser.connect(context.destination);
    void context.resume().catch(() => {
      // Autoplay policy; the cue's next play() will run it.
    });

    const graph = { analyser, bins: new Uint8Array(analyser.frequencyBinCount) };

    graphByMedia.set(media, graph);
    return graph;
  } catch {
    // No Web Audio, or an element already tapped by someone else: the floor
    // keeps its own time instead.
    return null;
  }
};

const readLowBandEnergy = (graph: AnalyserGraph): number => {
  graph.analyser.getByteFrequencyData(graph.bins);

  let energy = 0;

  for (let bin = LOW_BAND_FIRST_BIN; bin <= LOW_BAND_LAST_BIN; bin += 1) {
    energy += graph.bins[bin] ?? 0;
  }

  return energy;
};

type UseBeatClockProps = {
  mediaRef: RefObject<HTMLAudioElement | null>;
  // The graph can only be built after the room's tap: before it, the loop
  // runs with no analyser and the clock keeps time by itself.
  audioUnlocked: boolean;
  rootRef: RefObject<HTMLElement | null>;
};

export const useBeatClock = ({ mediaRef, audioUnlocked, rootRef }: UseBeatClockProps): void => {
  useEffect(() => {
    const root = rootRef.current;

    if (root === null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const media = mediaRef.current;
    const graph = audioUnlocked && media !== null ? attachAnalyser(media) : null;
    const clock = createBeatClock();
    let beat = 0;
    let frame = 0;

    const tick = (nowMs: number): void => {
      const energy = graph === null ? 0 : readLowBandEnergy(graph);

      if (clock.feed(energy, nowMs) !== null) {
        beat = beat === 0 ? 1 : 0;
        root.setAttribute("data-beat", String(beat));
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [audioUnlocked, mediaRef, rootRef]);
};
