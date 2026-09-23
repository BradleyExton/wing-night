import type { MinigameType, RoomState } from "@wingnight/shared";
import type { MinigameSurfacePhase } from "@wingnight/minigames-core";

import { resolveMinigameRendererBundle } from "../../../../minigames/registry";
import { isTimerTimeUp, isTimerUrgent } from "../../../../utils/timerUrgency";
import { useServerOrigin } from "../../../../utils/useServerOrigin";
import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type MinigameStageBodyProps = {
  phase: MinigameSurfacePhase;
  minigameType: MinigameType | null;
  activeTeamName: string | null;
  minigameDisplayView: RoomState["minigameDisplayView"];
  remainingTimerSeconds?: number | null;
};

const MinigameTimerChip = ({
  remainingSeconds
}: {
  remainingSeconds: number;
}): JSX.Element => {
  const isTimeUp = isTimerTimeUp(remainingSeconds);
  const isUrgent = isTimerUrgent(remainingSeconds);
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
  // Unconditional: the early returns below must not sit between the hook and
  // the component's first render pass.
  const serverOrigin = useServerOrigin();

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
        serverOrigin={serverOrigin}
      />
    </div>
  );
};
