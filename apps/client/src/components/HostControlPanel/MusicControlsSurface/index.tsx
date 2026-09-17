import { Pause, Play, SkipForward } from "lucide-react";
import {
  MUSIC_PLAYBACK_SOURCES,
  resolveTrackTitle,
  type RoomMusicPlaybackState
} from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type MusicControlsSurfaceProps = {
  musicPlayback: RoomMusicPlaybackState | null;
  onPauseMusic?: () => void;
  onResumeMusic?: () => void;
  onSkipMusicTrack?: () => void;
};

export const MusicControlsSurface = ({
  musicPlayback,
  onPauseMusic,
  onResumeMusic,
  onSkipMusicTrack
}: MusicControlsSurfaceProps): JSX.Element => {
  // A phase that owns no music has nothing to control, and an empty deck group
  // is worse than no deck group.
  if (musicPlayback === null) {
    return <></>;
  }

  const { isPlaying, source, trackCount, trackFileName, trackIndex } = musicPlayback;
  const sourceLabel =
    source === MUSIC_PLAYBACK_SOURCES.LOBBY
      ? hostControlPanelCopy.musicLobbyStatusLabel
      : hostControlPanelCopy.musicAnthemStatusLabel;
  const stateLabel = isPlaying
    ? hostControlPanelCopy.musicPlayingStatusLabel
    : hostControlPanelCopy.musicPausedStatusLabel;
  const pauseResumeLabel = isPlaying
    ? hostControlPanelCopy.musicPauseButtonLabel
    : hostControlPanelCopy.musicResumeButtonLabel;
  const handlePauseResume = isPlaying ? onPauseMusic : onResumeMusic;
  // A one-track source wraps to itself, so Next would do nothing — the server
  // rejects it, and the button says so rather than lying about being live.
  const canSkip = onSkipMusicTrack !== undefined && trackCount > 1;

  return (
    <section className={styles.group} data-music-controls>
      <div className={styles.groupHead}>
        <span>{hostControlPanelCopy.musicSectionTitle}</span>
        <span className={styles.groupCount}>
          {hostControlPanelCopy.musicStatusValue(sourceLabel, stateLabel)}
        </span>
      </div>
      <p className={styles.trackTitle}>
        {resolveTrackTitle(trackFileName)}
        {trackCount > 1 && (
          <span className={styles.trackPosition}>
            {hostControlPanelCopy.musicTrackPositionLabel(trackIndex, trackCount)}
          </span>
        )}
      </p>
      <div className={styles.controls}>
        <button
          className={styles.button}
          type="button"
          onClick={handlePauseResume}
          disabled={handlePauseResume === undefined}
        >
          {isPlaying ? (
            <Pause strokeWidth={2.4} className="h-[1.05rem] w-[1.05rem]" />
          ) : (
            <Play strokeWidth={2.4} className="h-[1.05rem] w-[1.05rem]" />
          )}
          {pauseResumeLabel}
        </button>
        <button
          className={styles.button}
          type="button"
          onClick={onSkipMusicTrack}
          disabled={!canSkip}
        >
          <SkipForward strokeWidth={2.4} className="h-[1.05rem] w-[1.05rem]" />
          {hostControlPanelCopy.musicSkipButtonLabel}
        </button>
      </div>
    </section>
  );
};
