import type { MinigameType, RoomState } from "@wingnight/shared";
import type { MinigameSurfacePhase } from "@wingnight/minigames-core";

import { useMinigameRendererBundle } from "../../../../minigames/useMinigameRendererBundle";
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
  // Unconditional: the early returns below must not sit between the hook and
  // the component's first render pass.
  const serverOrigin = useServerOrigin();
  // Warm by now in a real game: DisplayBoard asked for this chunk back when the
  // room named the round's minigame, phases ago. The null branch below is the
  // boot-from-cold path (a TV refreshed into MINIGAME_PLAY), not a phase change.
  const minigameRendererLoad = useMinigameRendererBundle(minigameType);

  if (minigameType === null) {
    return (
      <div className={styles.minigameShell}>
        <p className={styles.fallbackText}>{displayBoardCopy.roundFallbackLabel}</p>
      </div>
    );
  }

  if (minigameRendererLoad.rendererBundle === null) {
    // The chunk has failed often enough that silence has stopped being the
    // kinder answer — the retries are still running underneath, but the room
    // has been looking at an empty stage and deserves to know why.
    if (minigameRendererLoad.status === "unavailable") {
      return (
        <div className={styles.minigameShell}>
          <p className={styles.fallbackText}>
            {displayBoardCopy.minigameRendererUnavailableLabel(minigameType)}
          </p>
        </div>
      );
    }

    // An empty stage, not a spinner and not a message: the renderer is a LAN
    // fetch away and whatever we drew here would be gone before the room read
    // it. The shell keeps its size so the stage does not jump when it lands.
    return <div className={styles.minigameShell} aria-hidden />;
  }

  const { DisplaySurface } = minigameRendererLoad.rendererBundle;

  return (
    <div className={styles.minigameShell}>
      {remainingTimerSeconds !== null && (
        <MinigameTimerChip remainingSeconds={remainingTimerSeconds} />
      )}
      <DisplaySurface
        phase={phase}
        minigameType={minigameType}
        minigameDisplayView={minigameDisplayView}
        activeTeamName={activeTeamName}
        serverOrigin={serverOrigin}
      />
    </div>
  );
};
