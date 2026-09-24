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
import { StageContextHeader } from "./StageContextHeader";
import { SetupStageBody } from "./SetupStageBody";
import { TurnResultsStageBody } from "./TurnResultsStageBody";
import { useDisplayRoomState } from "../../../context/RoomStateContext";
import * as styles from "./styles";
import { useEatingCountdown } from "./useEatingCountdown";
import { useMinigameCountdown } from "./useMinigameCountdown";
import { resolveLeadingTeams } from "../../../utils/resolveLeadingTeams";
import { resolveSortedStandings } from "../../../utils/resolveSortedStandings";

type StageBodyProps = {
  stageViewModel: StageViewModel;
  phaseLabel: string;
  liveEatingRemainingSeconds: number | null;
  liveMinigameRemainingSeconds: number | null;
  leadingTeams: Team[];
};

const SetupBody = ({ stageViewModel }: StageBodyProps): JSX.Element => {
  return (
    <SetupStageBody
      gameConfig={stageViewModel.gameConfig}
      players={stageViewModel.players}
      teams={stageViewModel.teams}
      teamThemeByTeamId={stageViewModel.teamThemeByTeamId}
    />
  );
};

const FallbackBody = ({ stageViewModel, phaseLabel }: StageBodyProps): JSX.Element => {
  return (
    <FallbackStageBody
      phaseLabel={phaseLabel}
      hasRoomState={stageViewModel.hasRoomState}
    />
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
      activeTeamGenre={stageViewModel.activeTeamGenre}
      activeTeamTheme={stageViewModel.activeTeamTheme}
      activeTeamPlayers={stageViewModel.activeTeamPlayers}
      minigameType={stageViewModel.minigameType}
    />
  );
};

const MinigamePlayBody = ({
  stageViewModel,
  liveMinigameRemainingSeconds
}: StageBodyProps): JSX.Element => {
  return (
    <MinigameStageBody
      phase="play"
      minigameType={stageViewModel.minigameType}
      activeTeamName={stageViewModel.activeTeamName}
      minigameDisplayView={stageViewModel.minigameDisplayView}
      remainingTimerSeconds={liveMinigameRemainingSeconds}
      totalTimerSeconds={
        stageViewModel.minigameTimerSnapshot !== null
          ? Math.round(stageViewModel.minigameTimerSnapshot.durationMs / 1000)
          : null
      }
    />
  );
};

const TurnResultsBody = ({ stageViewModel }: StageBodyProps): JSX.Element => {
  return (
    <TurnResultsStageBody
      justFinishedTeamName={stageViewModel.activeTeamName}
      justFinishedTeamTheme={stageViewModel.activeTeamTheme}
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

const FinalResultsBody = ({ stageViewModel, leadingTeams }: StageBodyProps): JSX.Element => {
  const winner = leadingTeams.length === 1 ? leadingTeams[0] : null;

  return (
    <FinalResultsStageBody
      winnerTeamNames={leadingTeams.map((team) => team.name)}
      winnerScore={leadingTeams[0]?.totalScore ?? null}
      winnerTheme={
        winner === null ? null : (stageViewModel.teamThemeByTeamId.get(winner.id) ?? null)
      }
    />
  );
};

const STAGE_BODY_BY_MODE: Record<StageRenderMode, ComponentType<StageBodyProps>> = {
  setup: SetupBody,
  setup_locked: SetupBody,
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
  "minigame_intro",
  "turn_results",
  "round_results",
  "final_results"
]);

// SETUP and every full stage get the canvas with no inset, for the same
// reason: each body paints its own frame and carries its own padding, so a
// gutter here is a border around the show (StageSurface/styles). The fallback
// is the one page-shaped stage left, and the one that keeps the inset.
const resolveSurfaceClassName = (stageMode: StageRenderMode): string => {
  if (stageMode === "setup") {
    return styles.setupCard;
  }

  return FULL_STAGE_MODES.has(stageMode) ? styles.fullStageCanvas : styles.stageCanvas;
};

export const StageSurface = (): JSX.Element => {
  const roomState = useDisplayRoomState();
  const stageViewModel = resolveStageViewModel(roomState);
  const effectiveStageMode =
    stageViewModel.stageMode === "setup_locked" ? "setup" : stageViewModel.stageMode;
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
  const liveMinigameRemainingSeconds = useMinigameCountdown({
    stageMode: stageViewModel.stageMode,
    minigameTimerSnapshot: stageViewModel.minigameTimerSnapshot
  });
  const leadingTeams = resolveLeadingTeams(sortedStandings);

  const StageBody = STAGE_BODY_BY_MODE[effectiveStageMode];
  const stageBodyElement = (
    <StageBody
      stageViewModel={stageViewModel}
      phaseLabel={phaseLabel}
      liveEatingRemainingSeconds={liveEatingRemainingSeconds}
      liveMinigameRemainingSeconds={liveMinigameRemainingSeconds}
      leadingTeams={leadingTeams}
    />
  );

  const surfaceClassName = resolveSurfaceClassName(effectiveStageMode);
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
