import type { MinigameType, RoomState } from "@wingnight/shared";

import { resolveMinigameRendererBundle } from "../../../../minigames/registry";
import { displayBoardCopy } from "../../copy";
import { TurnMeta } from "../TurnMeta";
import * as styles from "./styles";

type MinigameStageBodyProps = {
  phaseLabel: string;
  minigamePhase: "intro" | "play" | null;
  minigameType: MinigameType | null;
  currentRoundConfig: RoomState["currentRoundConfig"];
  shouldRenderTeamTurnContext: boolean;
  activeTeamName: string | null;
  minigameDisplayView: RoomState["minigameDisplayView"];
};

export const MinigameStageBody = ({
  phaseLabel,
  minigamePhase,
  minigameType,
  currentRoundConfig,
  shouldRenderTeamTurnContext,
  activeTeamName,
  minigameDisplayView
}: MinigameStageBodyProps): JSX.Element => {
  if (minigameType === null || minigamePhase === null) {
    return (
      <>
        <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
        <p className={styles.fallbackText}>{displayBoardCopy.roundFallbackLabel}</p>
      </>
    );
  }

  const minigameRendererBundle = resolveMinigameRendererBundle(minigameType);

  return (
    <>
      <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
      <p className={styles.fallbackText}>
        {currentRoundConfig
          ? displayBoardCopy.roundMinigameSummary(currentRoundConfig.minigame)
          : displayBoardCopy.roundFallbackLabel}
      </p>
      {shouldRenderTeamTurnContext && activeTeamName !== null && (
        <TurnMeta activeTeamName={activeTeamName} />
      )}
      <div className={styles.minigameShell}>
        {minigameRendererBundle === null ? (
          <p className={styles.fallbackText}>
            {displayBoardCopy.minigameRendererUnavailableLabel(minigameType)}
          </p>
        ) : minigamePhase === "play" &&
          minigameType === "TRIVIA" &&
          minigameDisplayView === null ? (
          <p className={styles.fallbackText}>{displayBoardCopy.minigameWaitingForViewLabel}</p>
        ) : (
          <minigameRendererBundle.DisplaySurface
            phase={minigamePhase}
            minigameType={minigameType}
            minigameDisplayView={minigameDisplayView}
            activeTeamName={activeTeamName}
          />
        )}
      </div>
    </>
  );
};
