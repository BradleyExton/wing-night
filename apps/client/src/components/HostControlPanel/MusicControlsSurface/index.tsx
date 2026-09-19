import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import {
  MUSIC_PLAYBACK_SOURCES,
  resolveTrackTitle,
  type RoomMusicPlaybackState
} from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

// The slider speaks percent because a tablet thumb lands on "70", not "0.7";
// the room state and the socket payload stay on the element's 0–1 scale.
const VOLUME_STEP_PERCENT = 5;

export const toVolumePercent = (volume: number): number => {
  return Math.round(volume * 100);
};

export const fromVolumePercent = (percent: number): number => {
  return Math.min(1, Math.max(0, percent / 100));
};

type MusicControlsSurfaceProps = {
  musicPlayback: RoomMusicPlaybackState | null;
  musicVolume: number;
  onPauseMusic?: () => void;
  onResumeMusic?: () => void;
  onSkipMusicTrack?: () => void;
  onPreviousMusicTrack?: () => void;
  onSetMusicVolume?: (volume: number) => void;
};

export const MusicControlsSurface = ({
  musicPlayback,
  musicVolume,
  onPauseMusic,
  onResumeMusic,
  onSkipMusicTrack,
  onPreviousMusicTrack,
  onSetMusicVolume
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
  // A one-track source wraps to itself, so Back and Next would do nothing —
  // the server rejects both, and the buttons say so rather than lying about
  // being live.
  const canStep = trackCount > 1;
  const canSkip = onSkipMusicTrack !== undefined && canStep;
  const canStepBack = onPreviousMusicTrack !== undefined && canStep;
  const volumePercent = toVolumePercent(musicVolume);

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
          onClick={onPreviousMusicTrack}
          disabled={!canStepBack}
        >
          <SkipBack strokeWidth={2.4} className="h-[1.05rem] w-[1.05rem]" />
          {hostControlPanelCopy.musicPreviousButtonLabel}
        </button>
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
      <label className={styles.volumeRow}>
        <Volume2 strokeWidth={2.4} className={styles.volumeIcon} />
        <span className={styles.volumeLabel}>{hostControlPanelCopy.musicVolumeLabel}</span>
        <input
          className={styles.volumeSlider}
          type="range"
          min={0}
          max={100}
          step={VOLUME_STEP_PERCENT}
          value={volumePercent}
          disabled={onSetMusicVolume === undefined}
          data-music-volume
          onChange={(event): void => {
            onSetMusicVolume?.(fromVolumePercent(Number(event.target.value)));
          }}
        />
        <span className={styles.volumeValue}>
          {hostControlPanelCopy.musicVolumeValue(volumePercent)}
        </span>
      </label>
    </section>
  );
};
