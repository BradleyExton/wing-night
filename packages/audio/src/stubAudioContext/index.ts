// A stand-in for the AudioContext the boards' tests are handed, because the
// real one is not unit-testable. It records nothing about the sound — only
// that the graph was built without throwing, how many nodes were started and
// how often the context was asked to wake. Exported so a game's own cue-table
// test uses this one rather than growing a copy.

export type StubAudioContext = {
  context: AudioContext;
  startedNodes: () => number;
  resumeCalls: () => number;
  // The last value set on any gain node, by insertion order.
  gainValues: () => number[];
};

const createStubParam = (onSet?: (value: number) => void): AudioParam => {
  const param = {
    value: 0,
    setValueAtTime: (value: number): AudioParam => {
      onSet?.(value);
      return param;
    },
    linearRampToValueAtTime: (): AudioParam => param,
    exponentialRampToValueAtTime: (): AudioParam => param
  } as unknown as AudioParam;

  return param;
};

export const createStubAudioContext = (state: AudioContextState = "running"): StubAudioContext => {
  let startedNodes = 0;
  let resumeCalls = 0;
  const gainValues: number[] = [];
  const context = {
    state,
    currentTime: 2,
    sampleRate: 48_000,
    destination: {},
    resume: (): Promise<void> => {
      resumeCalls += 1;
      return Promise.resolve();
    },
    createGain: () => ({
      gain: createStubParam((value) => {
        gainValues.push(value);
      }),
      connect: (): void => undefined
    }),
    createOscillator: () => ({
      type: "sine",
      frequency: createStubParam(),
      connect: (): void => undefined,
      start: (): void => {
        startedNodes += 1;
      },
      stop: (): void => undefined
    }),
    createBufferSource: () => ({
      buffer: null,
      connect: (): void => undefined,
      start: (): void => {
        startedNodes += 1;
      },
      stop: (): void => undefined
    }),
    createBiquadFilter: () => ({
      type: "lowpass",
      frequency: createStubParam(),
      Q: createStubParam(),
      connect: (): void => undefined
    }),
    createBuffer: (_channels: number, frameCount: number) => ({
      getChannelData: (): Float32Array => new Float32Array(frameCount)
    })
  } as unknown as AudioContext;

  return {
    context,
    startedNodes: () => startedNodes,
    resumeCalls: () => resumeCalls,
    gainValues: () => [...gainValues]
  };
};
