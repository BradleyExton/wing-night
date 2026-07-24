import type { MinigameType, RoomState } from "@wingnight/shared";
import type { MinigameSurfacePhase } from "@wingnight/minigames-core";

import { resolveMinigameRendererBundle } from "../../../../minigames/registry";
import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type MinigameStageBodyProps = {
  phase: MinigameSurfacePhase;
  minigameType: MinigameType | null;
  activeTeamName: string | null;
  minigameDisplayView: RoomState["minigameDisplayView"];
  remainingTimerSeconds?: number | null;
};

const URGENT_THRESHOLD_SECONDS = 10;

const MinigameTimerChip = ({
  remainingSeconds
}: {
  remainingSeconds: number;
}): JSX.Element => {
  const isTimeUp = remainingSeconds <= 0;
  const isUrgent = remainingSeconds <= URGENT_THRESHOLD_SECONDS;
  const chipClassName = isTimeUp
    ? styles.timerChipTimeUp
    : isUrgent
      ? styles.timerChipUrgent
      : styles.timerChip;

  return (
    <div className={chipClassName}>
      {isTimeUp
        ? displayBoardCopy.minigameTimesUpLabel
        : displayBoardCopy.minigameTimerValue(remainingSeconds)}
    </div>
  );
};

export const MinigameStageBody = ({
  phase,
  minigameType,
  activeTeamName,
  minigameDisplayView,
  remainingTimerSeconds = null
}: MinigameStageBodyProps): JSX.Element => {
  if (minigameType === null) {
    return (
      <div className={styles.minigameShell}>
        <p className={styles.fallbackText}>{displayBoardCopy.roundFallbackLabel}</p>
      </div>
    );
  }

  const minigameRendererBundle = resolveMinigameRendererBundle(minigameType);

  if (minigameRendererBundle === null) {
    return (
      <div className={styles.minigameShell}>
        <p className={styles.fallbackText}>
          {displayBoardCopy.minigameRendererUnavailableLabel(minigameType)}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.minigameShell}>
      {remainingTimerSeconds !== null && (
        <MinigameTimerChip remainingSeconds={remainingTimerSeconds} />
      )}
      <minigameRendererBundle.DisplaySurface
        phase={phase}
        minigameType={minigameType}
        minigameDisplayView={minigameDisplayView}
        activeTeamName={activeTeamName}
      />
    </div>
  );
};
