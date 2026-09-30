import { resolveTrackTitle } from "@wingnight/shared";
import { VolumeX } from "lucide-react";

import { teaserMusicToggleCopy } from "./copy";
import * as styles from "./styles";

type TeaserMusicToggleProps = {
  trackSrc: string;
  isPlaying: boolean;
  onToggle: () => void;
};

// The song's pill: what is playing, and the button that plays or pauses it.
export const TeaserMusicToggle = ({
  trackSrc,
  isPlaying,
  onToggle
}: TeaserMusicToggleProps): JSX.Element => {
  const trackTitle = resolveTrackTitle(decodeURIComponent(trackSrc.split("/").pop() ?? ""));

  return (
    <button
      type="button"
      className={isPlaying ? styles.container : styles.containerPaused}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? teaserMusicToggleCopy.pauseAriaLabel : teaserMusicToggleCopy.playAriaLabel}
      data-teaser-music
      onClick={onToggle}
    >
      {isPlaying ? (
        <span className={styles.equalizer} aria-hidden>
          {styles.bars.map((barClassName) => (
            <span key={barClassName} className={barClassName} />
          ))}
        </span>
      ) : (
        <span className={styles.speaker} aria-hidden>
          <VolumeX className={styles.speakerIcon} />
        </span>
      )}
      <span className={styles.textColumn}>
        <span className={styles.label}>
          <span className={isPlaying ? styles.labelDot : styles.labelDotPaused} aria-hidden />
          {isPlaying ? teaserMusicToggleCopy.playingLabel : teaserMusicToggleCopy.pausedLabel}
        </span>
        <span className={isPlaying ? styles.title : styles.titlePaused}>{trackTitle}</span>
      </span>
    </button>
  );
};
