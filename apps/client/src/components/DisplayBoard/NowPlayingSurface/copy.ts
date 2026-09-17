export const nowPlayingCopy = {
  nowPlayingLabel: "Now playing",
  pausedLabel: "Paused",
  // The anthem names its team, because at MINIGAME_INTRO the room is looking at
  // that team and the track belongs to them.
  anthemLabel: (teamName: string): string => `${teamName} anthem`,
  anthemFallbackLabel: "Team anthem",
  trackCountLabel: (trackIndex: number, trackCount: number): string =>
    `${trackIndex + 1} / ${trackCount}`
} as const;
