import {
  MUSIC_PLAYBACK_SOURCES,
  resolveTrackTitle,
  type RoomMusicPlaybackState
} from "@wingnight/shared";

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

  const { isPlaying, source, trackFileName } = musicPlayback;

  // An anthem that is not playing has finished, and a finished one-shot has
  // nothing left to say — a pill with frozen bars would read as "paused", which
  // is a state the anthem never sits in for long. The lobby playlist is the
  // opposite: it IS a standing thing, so its pill survives a pause and says so.
  if (source === MUSIC_PLAYBACK_SOURCES.ANTHEM && !isPlaying) {
    return <></>;
  }

  const trackTitle = resolveTrackTitle(trackFileName);
  const bars = isPlaying ? styles.bars : styles.pausedBars;

  return (
    <section
      className={isPlaying ? styles.container : styles.containerPaused}
      data-now-playing
    >
      <span className={isPlaying ? styles.equalizer : styles.equalizerPaused} aria-hidden>
        {bars.map((barClassName) => (
          <span key={barClassName} className={barClassName} />
        ))}
      </span>
      <span className={styles.textColumn}>
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
      </span>
    </section>
  );
};
