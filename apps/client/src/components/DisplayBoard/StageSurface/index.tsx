import type { ComponentType } from "react";
import type { Team } from "@wingnight/shared";

import { displayBoardCopy } from "../copy";
import { EatingStageBody } from "./EatingStageBody";
import { FallbackStageBody } from "./FallbackStageBody";
import { FinalResultsStageBody } from "./FinalResultsStageBody";
import { MinigameIntroStageBody } from "./MinigameIntroStageBody";
import { MinigameStageBody } from "./MinigameStageBody";
import { resolveStageViewModel } from "./resolveStageViewModel";
import type { StageRenderMode, StageViewModel } from "./resolveStageViewModel";
import { RoundResultsStageBody } from "./RoundResultsStageBody";
import { RoundIntroStageBody } from "./RoundIntroStageBody";
import { StageContextHeader } from "./StageContextHeader";
import { SetupStageBody } from "./SetupStageBody";
import { TurnResultsStageBody } from "./TurnResultsStageBody";
import { useDisplayRoomState } from "../../../context/RoomStateContext";
import * as styles from "./styles";
import { useEatingCountdown } from "./useEatingCountdown";
import { resolveSortedStandings } from "../../../utils/resolveSortedStandings";

type StageSurfaceProps = {
  showSetupPreview?: boolean;
};

type StageBodyProps = {
  stageViewModel: StageViewModel;
  phaseLabel: string;
  liveEatingRemainingSeconds: number | null;
  winnerTeam: Team | null;
};

const SetupBody = ({ stageViewModel }: StageBodyProps): JSX.Element => {
  return <SetupStageBody gameConfig={stageViewModel.gameConfig} />;
};

const FallbackBody = ({ stageViewModel, phaseLabel }: StageBodyProps): JSX.Element => {
  return (
    <FallbackStageBody
      phaseLabel={phaseLabel}
      hasRoomState={stageViewModel.hasRoomState}
    />
  );
};

const RoundIntroBody = (props: StageBodyProps): JSX.Element => {
  const { stageViewModel } = props;

  return stageViewModel.currentRoundConfig !== null ? (
    <RoundIntroStageBody currentRoundConfig={stageViewModel.currentRoundConfig} />
  ) : (
    <FallbackBody {...props} />
  );
};

const EatingBody = (props: StageBodyProps): JSX.Element => {
  const { stageViewModel, liveEatingRemainingSeconds } = props;

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
    <FallbackBody {...props} />
  );
};

const MinigameIntroBody = ({ stageViewModel }: StageBodyProps): JSX.Element => {
  return (
    <MinigameIntroStageBody
      activeTeamName={stageViewModel.activeTeamName}
      activeTeamPlayerNames={stageViewModel.activeTeamPlayerNames}
      minigameType={stageViewModel.minigameType}
    />
  );
};

const MinigamePlayBody = ({ stageViewModel }: StageBodyProps): JSX.Element => {
  return (
    <MinigameStageBody
      phase="play"
      minigameType={stageViewModel.minigameType}
      activeTeamName={stageViewModel.activeTeamName}
      minigameDisplayView={stageViewModel.minigameDisplayView}
    />
  );
};

const TurnResultsBody = ({ stageViewModel }: StageBodyProps): JSX.Element => {
  return (
    <TurnResultsStageBody
      justFinishedTeamName={stageViewModel.activeTeamName}
      turnTiles={stageViewModel.turnTiles}
      nextTeamName={stageViewModel.nextTurnTeamName}
    />
  );
};

const RoundResultsBody = ({ stageViewModel }: StageBodyProps): JSX.Element => {
  return (
    <RoundResultsStageBody
      roundNumber={stageViewModel.currentRoundConfig?.round ?? null}
      teamRows={stageViewModel.roundResultsRows}
      topTeamId={stageViewModel.roundResultsTopTeamId}
    />
  );
};

const FinalResultsBody = ({ winnerTeam }: StageBodyProps): JSX.Element => {
  return (
    <FinalResultsStageBody
      winnerTeamName={winnerTeam?.name ?? null}
      winnerScore={winnerTeam?.totalScore ?? null}
    />
  );
};

const STAGE_BODY_BY_MODE: Record<StageRenderMode, ComponentType<StageBodyProps>> = {
  setup: SetupBody,
  setup_locked: SetupBody,
  round_intro: RoundIntroBody,
  eating: EatingBody,
  minigame_intro: MinigameIntroBody,
  minigame_play: MinigamePlayBody,
  turn_results: TurnResultsBody,
  round_results: RoundResultsBody,
  final_results: FinalResultsBody,
  fallback: FallbackBody
};

const FULL_STAGE_MODES: ReadonlySet<StageRenderMode> = new Set([
  "minigame_play",
  "eating",
  "round_intro",
  "minigame_intro",
  "turn_results",
  "round_results",
  "final_results"
]);

export const StageSurface = ({
  showSetupPreview = false
}: StageSurfaceProps): JSX.Element => {
  const roomState = useDisplayRoomState();
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

  const StageBody = STAGE_BODY_BY_MODE[effectiveStageMode];
  const stageBodyElement = (
    <StageBody
      stageViewModel={stageViewModel}
      phaseLabel={phaseLabel}
      liveEatingRemainingSeconds={liveEatingRemainingSeconds}
      winnerTeam={winnerTeam}
    />
  );

  const surfaceClassName =
    effectiveStageMode === "setup" ? styles.setupCard : styles.stageCanvas;
  const isFullStageMode = FULL_STAGE_MODES.has(effectiveStageMode);
  const shouldRenderStageContextHeader =
    effectiveStageMode !== "setup" && !isFullStageMode;
  const shouldWrapStageBody =
    effectiveStageMode !== "setup" && !isFullStageMode;

  return (
    <article className={surfaceClassName}>
      {shouldRenderStageContextHeader && <StageContextHeader />}
      {shouldWrapStageBody ? (
        <div className={styles.stageBody}>{stageBodyElement}</div>
      ) : (
        stageBodyElement
      )}
    </article>
  );
};
