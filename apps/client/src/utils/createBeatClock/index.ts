// Finds the beat in a stream of analyser readings, and keeps time on its own
// when there is no music to find it in. Pure numbers in, a verdict out, so
// the rule for "that was a kick" is testable without an AudioContext.
//
// The detector is the classic energy onset: the low band's energy this frame
// against its own average over the last two-thirds of a second. A kick is a
// spike well above that average, above a floor that silence and hiss never
// reach, and not within a refractory gap of the last one (nothing on a party
// playlist kicks faster than ~210 BPM). When no kick has been heard for a
// while — the room has not tapped yet, the host paused, a quiet intro — a
// 120 BPM metronome takes over until the music comes back.
export type BeatClockVerdict = "beat" | "fallback" | null;

export type BeatClock = {
  feed: (energy: number, nowMs: number) => BeatClockVerdict;
};

export type BeatClockOptions = {
  historyFrames: number;
  threshold: number;
  floor: number;
  minIntervalMs: number;
  fallbackIntervalMs: number;
  silenceMs: number;
};

export const BEAT_CLOCK_DEFAULTS: BeatClockOptions = {
  historyFrames: 40,
  threshold: 1.3,
  floor: 240,
  minIntervalMs: 280,
  fallbackIntervalMs: 500,
  silenceMs: 1600
};

const MIN_HISTORY_FRAMES = 8;

export const createBeatClock = (overrides: Partial<BeatClockOptions> = {}): BeatClock => {
  const options = { ...BEAT_CLOCK_DEFAULTS, ...overrides };
  const history: number[] = [];
  let historySum = 0;
  let lastDetectedAtMs = Number.NEGATIVE_INFINITY;
  let lastBeatAtMs = Number.NEGATIVE_INFINITY;

  return {
    feed: (energy, nowMs) => {
      history.push(energy);
      historySum += energy;

      if (history.length > options.historyFrames) {
        historySum -= history.shift() ?? 0;
      }

      const average = historySum / history.length;
      const isOnset =
        history.length >= MIN_HISTORY_FRAMES &&
        energy >= options.floor &&
        energy > average * options.threshold &&
        nowMs - lastBeatAtMs >= options.minIntervalMs;

      if (isOnset) {
        lastDetectedAtMs = nowMs;
        lastBeatAtMs = nowMs;
        return "beat";
      }

      const isSilent = nowMs - lastDetectedAtMs >= options.silenceMs;

      if (isSilent && nowMs - lastBeatAtMs >= options.fallbackIntervalMs) {
        lastBeatAtMs = nowMs;
        return "fallback";
      }

      return null;
    }
  };
};
