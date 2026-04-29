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
};

export const MinigameStageBody = ({
  phase,
  minigameType,
  activeTeamName,
  minigameDisplayView
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
      <minigameRendererBundle.DisplaySurface
        phase={phase}
        minigameType={minigameType}
        minigameDisplayView={minigameDisplayView}
        activeTeamName={activeTeamName}
      />
    </div>
  );
};
