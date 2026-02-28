import { type RoomState } from "@wingnight/shared";

import { displayBoardCopy } from "../copy";
import { EatingStageBody } from "./EatingStageBody";
import { FallbackStageBody } from "./FallbackStageBody";
import { MinigameIntroStageBody } from "./MinigameIntroStageBody";
import { MinigamePlayStageBody } from "./MinigamePlayStageBody";
import { resolveStageViewModel, type StageRenderMode } from "./resolveStageViewModel";
import { RoundIntroStageBody } from "./RoundIntroStageBody";
import { SetupStageBody } from "./SetupStageBody";
import * as styles from "./styles";
import { useEatingCountdown } from "./useEatingCountdown";

type StageSurfaceProps = {
  roomState: RoomState | null;
};

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

export const StageSurface = ({
  roomState
}: StageSurfaceProps): JSX.Element => {
  const stageViewModel = resolveStageViewModel(roomState);
  const phaseLabel =
    stageViewModel.phase === null
      ? displayBoardCopy.waitingPhaseLabel
      : displayBoardCopy.phaseLabel(stageViewModel.phase);
  const roundMetaLabel = roomState
    ? displayBoardCopy.currentRoundLabel(roomState.currentRound, roomState.totalRounds)
    : displayBoardCopy.waitingForStateLabel;

  const liveEatingRemainingSeconds = useEatingCountdown({
    stageMode: stageViewModel.stageMode,
    eatingTimerSnapshot: stageViewModel.eatingTimerSnapshot,
    fallbackEatingSeconds: stageViewModel.fallbackEatingSeconds
  });

  const renderStageBody = (stageMode: StageRenderMode): JSX.Element => {
    switch (stageMode) {
      case "setup":
        return (
          <SetupStageBody
            gameConfig={stageViewModel.gameConfig}
            teamCount={stageViewModel.teamCount}
            playerCount={stageViewModel.playerCount}
            teamNames={stageViewModel.teamNames}
            canAdvancePhase={stageViewModel.canAdvancePhase}
          />
        );
      case "round_intro":
        return stageViewModel.currentRoundConfig !== null ? (
          <RoundIntroStageBody currentRoundConfig={stageViewModel.currentRoundConfig} />
        ) : (
          <FallbackStageBody
            phaseLabel={phaseLabel}
            hasRoomState={stageViewModel.hasRoomState}
          />
        );
      case "eating":
        return liveEatingRemainingSeconds !== null ? (
          <EatingStageBody
            phaseLabel={phaseLabel}
            currentRoundConfig={stageViewModel.currentRoundConfig}
            shouldRenderTeamTurnContext={stageViewModel.shouldRenderTeamTurnContext}
            activeTeamName={stageViewModel.activeTeamName}
            liveEatingRemainingSeconds={liveEatingRemainingSeconds}
          />
        ) : (
          <FallbackStageBody
            phaseLabel={phaseLabel}
            hasRoomState={stageViewModel.hasRoomState}
          />
        );
      case "minigame_intro":
        return (
          <MinigameIntroStageBody
            phaseLabel={phaseLabel}
            minigameType={stageViewModel.minigameType}
            minigameIntroMetadata={stageViewModel.minigameIntroMetadata}
            currentRoundConfig={stageViewModel.currentRoundConfig}
            shouldRenderTeamTurnContext={stageViewModel.shouldRenderTeamTurnContext}
            activeTeamName={stageViewModel.activeTeamName}
          />
        );
      case "minigame_play":
        return (
          <MinigamePlayStageBody
            phaseLabel={phaseLabel}
            minigameType={stageViewModel.minigameType}
            currentRoundConfig={stageViewModel.currentRoundConfig}
            shouldRenderTeamTurnContext={stageViewModel.shouldRenderTeamTurnContext}
            activeTeamName={stageViewModel.activeTeamName}
            minigameDisplayView={stageViewModel.minigameDisplayView}
          />
        );
      case "fallback":
        return (
          <FallbackStageBody
            phaseLabel={phaseLabel}
            hasRoomState={stageViewModel.hasRoomState}
          />
        );
      default:
        return assertUnreachable(stageMode);
    }
  };

  const surfaceClassName =
    stageViewModel.stageMode === "setup" ? styles.setupCard : styles.card;
  const shouldRenderSurfaceContext = stageViewModel.stageMode !== "setup";

  return (
    <article className={surfaceClassName}>
      {shouldRenderSurfaceContext && (
        <div className={styles.surfaceContextRow}>
          <p className={styles.surfaceContextMeta}>{roundMetaLabel}</p>
          <p className={styles.surfaceContextBadge}>{phaseLabel}</p>
        </div>
      )}
      {renderStageBody(stageViewModel.stageMode)}
    </article>
  );
};
