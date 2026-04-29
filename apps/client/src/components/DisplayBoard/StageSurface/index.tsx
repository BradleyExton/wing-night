import type { DisplayRoomStateSnapshot } from "@wingnight/shared";

import { displayBoardCopy } from "../copy";
import { EatingStageBody } from "./EatingStageBody";
import { FallbackStageBody } from "./FallbackStageBody";
import { FinalResultsStageBody } from "./FinalResultsStageBody";
import { MinigameIntroStageBody } from "./MinigameIntroStageBody";
import { MinigameStageBody } from "./MinigameStageBody";
import { resolveStageViewModel, type StageRenderMode } from "./resolveStageViewModel";
import { RoundResultsStageBody } from "./RoundResultsStageBody";
import { RoundIntroStageBody } from "./RoundIntroStageBody";
import { StageContextHeader } from "./StageContextHeader";
import { SetupStageBody } from "./SetupStageBody";
import { TurnResultsStageBody } from "./TurnResultsStageBody";
import * as styles from "./styles";
import { useEatingCountdown } from "./useEatingCountdown";
import { resolveSortedStandings } from "../../../utils/resolveSortedStandings";

type StageSurfaceProps = {
  roomState: DisplayRoomStateSnapshot | null;
  showSetupPreview?: boolean;
};

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

export const StageSurface = ({
  roomState,
  showSetupPreview = false
}: StageSurfaceProps): JSX.Element => {
  const stageViewModel = resolveStageViewModel(roomState);
  const effectiveStageMode =
    showSetupPreview || stageViewModel.stageMode === "setup_locked"
      ? "setup"
      : stageViewModel.stageMode;
  const sortedStandings = roomState ? resolveSortedStandings(roomState.teams) : [];
  const phaseLabel =
    stageViewModel.phase === null
      ? displayBoardCopy.waitingPhaseLabel
      : displayBoardCopy.phaseLabel(stageViewModel.phase);

  const liveEatingRemainingSeconds = useEatingCountdown({
    stageMode: stageViewModel.stageMode,
    eatingTimerSnapshot: stageViewModel.eatingTimerSnapshot,
    fallbackEatingSeconds: stageViewModel.fallbackEatingSeconds
  });
  const winnerTeam = sortedStandings[0] ?? null;

  const renderStageBody = (stageMode: StageRenderMode): JSX.Element => {
    switch (stageMode) {
      case "setup":
      case "setup_locked":
        return <SetupStageBody gameConfig={stageViewModel.gameConfig} />;
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
            currentRoundConfig={stageViewModel.currentRoundConfig}
            activeTeamName={stageViewModel.activeTeamName}
            liveEatingRemainingSeconds={liveEatingRemainingSeconds}
            totalEatingSeconds={
              stageViewModel.eatingTimerSnapshot !== null
                ? Math.round(stageViewModel.eatingTimerSnapshot.durationMs / 1000)
                : stageViewModel.fallbackEatingSeconds
            }
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
            activeTeamName={stageViewModel.activeTeamName}
            activeTeamPlayerNames={stageViewModel.activeTeamPlayerNames}
            minigameType={stageViewModel.minigameType}
          />
        );
      case "minigame_play":
        return (
          <MinigameStageBody
            phase="play"
            minigameType={stageViewModel.minigameType}
            activeTeamName={stageViewModel.activeTeamName}
            minigameDisplayView={stageViewModel.minigameDisplayView}
          />
        );
      case "turn_results":
        return (
          <TurnResultsStageBody
            justFinishedTeamName={stageViewModel.activeTeamName}
            turnTiles={stageViewModel.turnTiles}
            nextTeamName={stageViewModel.nextTurnTeamName}
          />
        );
      case "round_results":
        return (
          <RoundResultsStageBody
            roundNumber={stageViewModel.currentRoundConfig?.round ?? null}
            teamRows={stageViewModel.roundResultsRows}
            topTeamId={stageViewModel.roundResultsTopTeamId}
          />
        );
      case "final_results":
        return (
          <FinalResultsStageBody
            winnerTeamName={winnerTeam?.name ?? null}
            winnerScore={winnerTeam?.totalScore ?? null}
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
    effectiveStageMode === "setup" ? styles.setupCard : styles.stageCanvas;
  const isFullStageMode =
    effectiveStageMode === "minigame_play" ||
    effectiveStageMode === "eating" ||
    effectiveStageMode === "round_intro" ||
    effectiveStageMode === "minigame_intro" ||
    effectiveStageMode === "turn_results" ||
    effectiveStageMode === "round_results" ||
    effectiveStageMode === "final_results";
  const shouldRenderStageContextHeader =
    effectiveStageMode !== "setup" && !isFullStageMode;
  const shouldWrapStageBody =
    effectiveStageMode !== "setup" && !isFullStageMode;

  return (
    <article className={surfaceClassName}>
      {shouldRenderStageContextHeader && <StageContextHeader />}
      {shouldWrapStageBody ? (
        <div className={styles.stageBody}>{renderStageBody(effectiveStageMode)}</div>
      ) : (
        renderStageBody(effectiveStageMode)
      )}
    </article>
  );
};
