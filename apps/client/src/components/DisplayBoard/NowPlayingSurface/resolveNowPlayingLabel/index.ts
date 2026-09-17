import { MUSIC_PLAYBACK_SOURCES, type MusicPlaybackSource } from "@wingnight/shared";

import { nowPlayingCopy } from "../copy";

// Stripped to letters and digits so the comparison survives the casing and the
// hyphens a derived title carries: `molten-metal-anthem.mp3` titles as
// "Molten Metal Anthem" against a team named "Molten Metal".
const normalizeForComparison = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Naming an anthem file after its team is the obvious thing to do — the sample
// pack does it, so it is what every fresh clone shows — and it makes the honest
// label redundant: "MOLTEN METAL ANTHEM · Molten Metal Anthem". When the title
// already says whose it is, the label steps back to the bare noun.
export const resolveNowPlayingLabel = (
  source: MusicPlaybackSource,
  isPlaying: boolean,
  trackTitle: string,
  anthemTeamName: string | null
): string => {
  if (source === MUSIC_PLAYBACK_SOURCES.ANTHEM) {
    if (
      anthemTeamName === null ||
      normalizeForComparison(trackTitle).includes(
        normalizeForComparison(anthemTeamName)
      )
    ) {
      return nowPlayingCopy.anthemFallbackLabel;
    }

    return nowPlayingCopy.anthemLabel(anthemTeamName);
  }

  return isPlaying ? nowPlayingCopy.nowPlayingLabel : nowPlayingCopy.pausedLabel;
};
