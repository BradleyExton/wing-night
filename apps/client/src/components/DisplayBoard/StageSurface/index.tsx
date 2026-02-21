import { type RoomState } from "@wingnight/shared";

import { EatingStageBody } from "./EatingStageBody";
import { FallbackStageBody } from "./FallbackStageBody";
import { MinigameStageBody } from "./MinigameStageBody";
import { resolveStageViewModel, type StageRenderMode } from "./resolveStageViewModel";
import { RoundIntroStageBody } from "./RoundIntroStageBody";
import * as styles from "./styles";
import { useEatingCountdown } from "./useEatingCountdown";

type StageSurfaceProps = {
  roomState: RoomState | null;
  phaseLabel: string;
};

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

export const StageSurface = ({
  roomState,
  phaseLabel
}: StageSurfaceProps): JSX.Element => {
  const stageViewModel = resolveStageViewModel(roomState);

  const liveEatingRemainingSeconds = useEatingCountdown({
    stageMode: stageViewModel.stageMode,
    eatingTimerSnapshot: stageViewModel.eatingTimerSnapshot,
    fallbackEatingSeconds: stageViewModel.fallbackEatingSeconds
  });

  const renderStageBody = (stageMode: StageRenderMode): JSX.Element => {
    switch (stageMode) {
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
      case "minigame":
        return (
          <MinigameStageBody
            phaseLabel={phaseLabel}
            minigamePhase={stageViewModel.minigamePhase}
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

  return <article className={styles.card}>{renderStageBody(stageViewModel.stageMode)}</article>;
};
