import {
  MUSIC_PLAYBACK_SOURCES,
  resolveTrackTitle,
  type RoomMusicPlaybackState
} from "@wingnight/shared";

import { nowPlayingCopy } from "./copy";
import { resolveNowPlayingLabel } from "./resolveNowPlayingLabel";
import * as styles from "./styles";

type NowPlayingSurfaceProps = {
  musicPlayback: RoomMusicPlaybackState | null;
  // Named only for the anthem; the lobby playlist belongs to the room.
  anthemTeamName: string | null;
};

export const NowPlayingSurface = ({
  musicPlayback,
  anthemTeamName
}: NowPlayingSurfaceProps): JSX.Element => {
  if (musicPlayback === null) {
    return <></>;
  }

  const { isPlaying, source, trackCount, trackFileName, trackIndex } = musicPlayback;

  // An anthem that is not playing has finished, and a finished one-shot has
  // nothing left to say — a row with frozen bars would read as "paused", which
  // is a state the anthem never sits in for long. The lobby playlist is the
  // opposite: it IS a standing thing, so its row survives a pause and says so.
  if (source === MUSIC_PLAYBACK_SOURCES.ANTHEM && !isPlaying) {
    return <></>;
  }

  const trackTitle = resolveTrackTitle(trackFileName);
  const bars = isPlaying ? styles.bars : styles.pausedBars;
  // An anthem is a one-shot cue, so there is no "n of m" position to show —
  // only a playlist has somewhere to be in.
  const shouldShowTrackCount =
    source === MUSIC_PLAYBACK_SOURCES.LOBBY && trackCount > 1;

  return (
    <section className={styles.container} data-now-playing>
      <span
        className={isPlaying ? styles.equalizer : styles.equalizerPaused}
        aria-hidden
      >
        {bars.map((barClassName) => (
          <span key={barClassName} className={barClassName} />
        ))}
      </span>
      <span className={styles.label}>
        <span
          className={isPlaying ? styles.labelDot : styles.labelDotPaused}
          aria-hidden
        />
        {resolveNowPlayingLabel(source, isPlaying, trackTitle, anthemTeamName)}
      </span>
      <span className={isPlaying ? styles.title : styles.titlePaused}>
        {trackTitle}
      </span>
      {shouldShowTrackCount && (
        <span className={styles.trackCount}>
          {nowPlayingCopy.trackCountLabel(trackIndex, trackCount)}
        </span>
      )}
    </section>
  );
};
