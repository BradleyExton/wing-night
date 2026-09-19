// A volume ramp on the display's `<audio>` element: the fade-in when a track
// starts and the fade-out before one stops or is swapped. Presentation only —
// the server still owns WHAT plays and WHETHER it plays; this owns the second
// and a half between one of those decisions and the speaker.
//
// Time-based rather than step-based: the ramp interpolates on the clock every
// tick, so a throttled timer (a TV tab that is briefly hidden) makes the fade
// coarser without ever leaving it short of its target.

export const FADE_IN_MS = 1200;
export const FADE_OUT_MS = 900;
const RAMP_TICK_MS = 40;

type RampMedia = Pick<HTMLAudioElement, "volume">;

export type VolumeRamp = {
  cancel: () => void;
};

export const resolveRampVolume = (
  fromVolume: number,
  toVolume: number,
  elapsedMs: number,
  durationMs: number
): number => {
  if (durationMs <= 0 || elapsedMs >= durationMs) {
    return toVolume;
  }

  if (elapsedMs <= 0) {
    return fromVolume;
  }

  return fromVolume + (toVolume - fromVolume) * (elapsedMs / durationMs);
};

const clampVolume = (volume: number): number => {
  return Math.min(1, Math.max(0, volume));
};

// `resolveTarget` is a function, not a number, because the host can move the
// master volume mid-fade: a fade-in that captured "0.8" at its start would
// land on 0.8 after the host dragged the slider to 0.3.
export const createVolumeRamp = (
  media: RampMedia,
  resolveTarget: () => number,
  durationMs: number,
  onDone: () => void,
  now: () => number = Date.now
): VolumeRamp => {
  const fromVolume = media.volume;
  const startedAt = now();
  let finished = false;

  const finish = (): void => {
    if (finished) {
      return;
    }

    finished = true;
    clearInterval(interval);
  };

  const tick = (): void => {
    const elapsedMs = now() - startedAt;
    const nextVolume = clampVolume(
      resolveRampVolume(fromVolume, resolveTarget(), elapsedMs, durationMs)
    );

    try {
      media.volume = nextVolume;
    } catch {
      // An engine that owns its own volume (iOS). The ramp still completes so
      // whatever waits on it — a stop, a track swap — still happens.
    }

    if (elapsedMs >= durationMs) {
      finish();
      onDone();
    }
  };

  const interval = setInterval(tick, RAMP_TICK_MS);

  return {
    cancel: finish
  };
};
