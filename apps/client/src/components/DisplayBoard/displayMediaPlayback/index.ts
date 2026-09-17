// Shared by everything that drives the display's single `<audio>` element, so
// no two callers can drift on what "best effort" means.
//
// Every media call here swallows its failure, mirroring `useTimesUpChime`: a
// rejected play(), a blocked autoplay policy or a 404 track must never throw
// and never block a phase advance. A party does not stall over music.
export const playQuietly = (media: HTMLAudioElement): void => {
  try {
    void media.play().catch(() => {
      // Autoplay policy, or a missing file. Not our problem to surface.
    });
  } catch {
    // Some engines throw synchronously rather than rejecting.
  }
};

// Distinct from `stopQuietly` by exactly one line, and the difference is the
// whole point: a host pause has to be resumable from where the track was, so
// this one must NOT rewind. Stopping is for handing the element to a different
// track; pausing is for picking the same one back up.
export const pauseQuietly = (media: HTMLAudioElement): void => {
  try {
    media.pause();
  } catch {
    // Best-effort; a detached element must not break the phase advance.
  }
};

export const stopQuietly = (media: HTMLAudioElement): void => {
  try {
    media.pause();
    media.currentTime = 0;
  } catch {
    // Best-effort; a detached element must not break the phase advance.
  }
};
