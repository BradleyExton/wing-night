// Shared by both cues that drive the display's single `<audio>` element, so the
// anthem and the lobby playlist cannot drift on what "best effort" means.
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

export const stopQuietly = (media: HTMLAudioElement): void => {
  try {
    media.pause();
    media.currentTime = 0;
  } catch {
    // Best-effort; a detached element must not break the phase advance.
  }
};
