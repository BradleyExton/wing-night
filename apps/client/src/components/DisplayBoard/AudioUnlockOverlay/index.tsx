import { Volume2 } from "lucide-react";

import { audioUnlockOverlayCopy } from "./copy";
import * as styles from "./styles";

type AudioUnlockOverlayProps = {
  onUnlock: () => void;
};

// Rendered only at MINIGAME_INTRO, for a team that has anthems, while audio is
// still locked. The tap is the only moment a browser will let us prime a media
// element, so this is the one place the anthem can be armed from.
export const AudioUnlockOverlay = ({
  onUnlock
}: AudioUnlockOverlayProps): JSX.Element => {
  return (
    <div
      className={styles.overlay}
      data-audio-unlock-overlay
      role="button"
      tabIndex={0}
      onPointerDown={onUnlock}
    >
      <div className={styles.speakerFrame}>
        <span className={styles.speakerIcon}>
          <Volume2 className={styles.speakerIconSvg} aria-hidden />
        </span>
      </div>
      <h2 className={styles.heading}>
        {audioUnlockOverlayCopy.headingLead}{" "}
        <span className={styles.headingAccent}>
          {audioUnlockOverlayCopy.headingAccent}
        </span>
      </h2>
      <p className={styles.instructionLabel}>
        {audioUnlockOverlayCopy.instructionLabel}
      </p>
    </div>
  );
};
