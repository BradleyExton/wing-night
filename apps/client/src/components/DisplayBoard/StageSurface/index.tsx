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
};

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

export const StageSurface = ({
  roomState
}: StageSurfaceProps): JSX.Element => {
  const stageViewModel = resolveStageViewModel(roomState);
  const sortedStandings = roomState ? resolveSortedStandings(roomState.teams) : [];
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
  const totalTurnCount = roomState?.turnOrderTeamIds.length ?? roomState?.teams.length ?? 0;
  const completedTurnCount = roomState?.completedRoundTurnTeamIds.length ?? 0;
  const hasNextTurn = totalTurnCount > 0 && completedTurnCount < totalTurnCount;
  const wingPointsByTeamId = roomState?.pendingWingPointsByTeamId ?? {};
  const minigamePointsByTeamId = roomState?.pendingMinigamePointsByTeamId ?? {};
  const roundWingPoints = Object.values(wingPointsByTeamId).reduce((sum, points) => {
    return sum + points;
  }, 0);
  const roundMinigamePoints = Object.values(minigamePointsByTeamId).reduce((sum, points) => {
    return sum + points;
  }, 0);
  const winnerTeam = sortedStandings[0] ?? null;

  const renderStageBody = (stageMode: StageRenderMode): JSX.Element => {
    switch (stageMode) {
      case "setup":
        return <SetupStageBody gameConfig={stageViewModel.gameConfig} />;
      case "setup_locked":
        return <SetupStageBody gameConfig={stageViewModel.gameConfig} isLocked />;
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
            minigameType={stageViewModel.minigameType}
            sauceName={stageViewModel.currentRoundConfig?.sauce ?? null}
            activeTeamName={stageViewModel.activeTeamName}
          />
        );
      case "minigame_play":
        return (
          <MinigameStageBody
            phaseLabel={phaseLabel}
            minigameType={stageViewModel.minigameType}
            currentRoundConfig={stageViewModel.currentRoundConfig}
            shouldRenderTeamTurnContext={stageViewModel.shouldRenderTeamTurnContext}
            activeTeamName={stageViewModel.activeTeamName}
            minigameDisplayView={stageViewModel.minigameDisplayView}
          />
        );
      case "turn_results":
        return (
          <TurnResultsStageBody
            activeTeamName={stageViewModel.activeTeamName}
            completedTurnCount={completedTurnCount}
            totalTurnCount={totalTurnCount}
            hasNextTurn={hasNextTurn}
          />
        );
      case "round_results":
        return (
          <RoundResultsStageBody
            wingPoints={roundWingPoints}
            minigamePoints={roundMinigamePoints}
            totalRoundPoints={roundWingPoints + roundMinigamePoints}
          />
        );
      case "final_results":
        return (
          <FinalResultsStageBody
            winnerTeamName={winnerTeam?.name ?? null}
            winnerScore={winnerTeam?.totalScore ?? null}
            teamCount={sortedStandings.length}
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
    stageViewModel.stageMode === "setup" || stageViewModel.stageMode === "setup_locked"
      ? styles.setupCard
      : stageViewModel.stageMode === "minigame_play"
        ? styles.card
        : styles.stageCanvas;
  const shouldRenderStageContextHeader =
    stageViewModel.stageMode !== "setup" &&
    stageViewModel.stageMode !== "setup_locked" &&
    stageViewModel.stageMode !== "minigame_play";
  const shouldRenderSurfaceContext = stageViewModel.stageMode === "minigame_play";
  const shouldRenderTeamContextPill =
    stageViewModel.shouldRenderTeamTurnContext && stageViewModel.activeTeamName !== null;

  return (
    <article className={surfaceClassName}>
      {shouldRenderStageContextHeader && (
        <StageContextHeader
          phaseLabel={phaseLabel}
          roundMetaLabel={roundMetaLabel}
          activeTeamName={
            shouldRenderTeamContextPill ? stageViewModel.activeTeamName : null
          }
        />
      )}
      {shouldRenderSurfaceContext && (
        <div className={styles.surfaceContextRow}>
          <p className={styles.surfaceContextMeta}>{roundMetaLabel}</p>
          <p className={styles.surfaceContextBadge}>{phaseLabel}</p>
        </div>
      )}
      {shouldRenderStageContextHeader ? (
        <div className={styles.stageBody}>{renderStageBody(stageViewModel.stageMode)}</div>
      ) : (
        renderStageBody(stageViewModel.stageMode)
      )}
    </article>
  );
};
