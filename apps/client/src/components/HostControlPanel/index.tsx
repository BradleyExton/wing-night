import { useEffect, useId, useMemo, useState } from "react";
import { type RoomState } from "@wingnight/shared";

import { ContentFatalState } from "../ContentFatalState";
import { HostActionBarSurface } from "./HostActionBarSurface";
import { OverrideActionsSurface } from "./OverrideActionsSurface";
import { OverrideDock } from "./OverrideDock";
import { hostControlPanelCopy } from "./copy";
import { HostPhaseBody } from "./HostPhaseBody";
import { resolveHostRenderMode } from "./resolveHostRenderMode";
import { resolveSortedStandings } from "../../utils/resolveSortedStandings";
import { resolveOrderedTeams } from "./roomTeamSelectors";
import { ScoreOverrideSurface } from "./ScoreOverrideSurface";
import { selectOverrideDockContext } from "./selectOverrideDockContext";
import { selectHostTeamMaps } from "./selectHostTeamMaps";
import { createMinigameHandlers, createSetupHandlers } from "./setupHandlers";
import { TurnOrderSurface } from "./TurnOrderSurface";
import type { HostControlPanelProps } from "./types";
import * as styles from "./styles";

const EMPTY_TEAMS: RoomState["teams"] = [];

export const HostControlPanel = ({
  roomState,
  onNextPhase,
  onCreateTeam,
  onAddPlayer,
  onAssignPlayer,
  onAutoAssignRemainingPlayers,
  onSetWingParticipation,
  onDispatchMinigameAction,
  onPauseTimer,
  onResumeTimer,
  onExtendTimer,
  onReorderTurnOrder,
  onSkipTurnBoundary,
  onAdjustTeamScore,
  onResetGame,
  onRedoLastMutation
}: HostControlPanelProps): JSX.Element => {
  const [nextTeamName, setNextTeamName] = useState("");
  const [isOverrideDockOpen, setIsOverrideDockOpen] = useState(false);
  const overrideDockPanelId = useId();
  const { assignedTeamByPlayerId, teamNameByTeamId } = useMemo(() => {
    return selectHostTeamMaps(roomState);
  }, [roomState]);
  const players = roomState?.players ?? [];
  const teams = roomState?.teams ?? EMPTY_TEAMS;
  const phase = roomState?.phase ?? null;
  const fatalError = roomState?.fatalError ?? null;
  const hostMode = resolveHostRenderMode(phase);
  const isMinigameTakeover =
    hostMode === "minigame_intro" || hostMode === "minigame_play";
  const minigameHostView = roomState?.minigameHostView ?? null;
  const minigameType =
    minigameHostView?.minigame ?? roomState?.currentRoundConfig?.minigame ?? null;
  const triviaHostView =
    minigameHostView?.minigame === "TRIVIA" ? minigameHostView : null;
  const wingParticipationByPlayerId = roomState?.wingParticipationByPlayerId ?? {};
  const activeRoundTeamId = roomState?.activeRoundTeamId ?? null;
  const activeRoundTeamName =
    activeRoundTeamId !== null
      ? (teamNameByTeamId.get(activeRoundTeamId) ??
        hostControlPanelCopy.noAssignedTeamLabel)
      : hostControlPanelCopy.noAssignedTeamLabel;
  const currentTriviaPrompt = triviaHostView?.currentPrompt ?? null;
  const activeTurnTeamId =
    minigameHostView?.activeTurnTeamId ?? roomState?.activeTurnTeamId ?? null;
  const triviaAttemptsRemaining = triviaHostView?.attemptsRemaining ?? 0;
  const setupMutationsDisabled = onCreateTeam === undefined || hostMode !== "setup";
  const addPlayerDisabled = onAddPlayer === undefined || hostMode !== "setup";
  const assignmentDisabled = onAssignPlayer === undefined || hostMode !== "setup";
  const autoAssignDisabled =
    onAutoAssignRemainingPlayers === undefined || hostMode !== "setup";
  const participationDisabled = onSetWingParticipation === undefined || hostMode !== "eating";
  const canDispatchMinigameAction =
    onDispatchMinigameAction !== undefined &&
    hostMode === "minigame_play" &&
    minigameType !== null &&
    activeTurnTeamId !== null &&
    (minigameType !== "TRIVIA" ||
      (currentTriviaPrompt !== null && triviaAttemptsRemaining > 0));
  const nextPhaseDisabled =
    onNextPhase === undefined || roomState?.canAdvancePhase !== true;
  const sortedStandings = useMemo(() => resolveSortedStandings(teams), [teams]);
  const orderedTeams = useMemo(() => resolveOrderedTeams(roomState), [roomState]);
  const overrideDockContext = useMemo(() => {
    return selectOverrideDockContext(roomState);
  }, [roomState]);
  const hasNextRoundTurn =
    roomState !== null &&
    roomState.roundTurnCursor + 1 < roomState.turnOrderTeamIds.length;
  const hasAdditionalRounds =
    roomState !== null && roomState.currentRound < roomState.totalRounds;
  const primaryButtonLabel =
    phase === null
      ? hostControlPanelCopy.nextPhaseButtonLabel
      : hostControlPanelCopy.primaryActionLabel(phase, {
          hasNextRoundTurn,
          hasAdditionalRounds
        });
  const containerClassName = isMinigameTakeover
    ? styles.takeoverContainer
    : styles.container;
  useEffect(() => {
    if (!overrideDockContext.isVisible && isOverrideDockOpen) {
      setIsOverrideDockOpen(false);
    }
  }, [isOverrideDockOpen, overrideDockContext.isVisible]);
  const {
    handleCreateTeamSubmit,
    handleAssignmentChange,
    handleAddPlayer,
    handleAutoAssignRemainingPlayers
  } = createSetupHandlers({
    hostMode,
    nextTeamName,
    onCreateTeam,
    onAddPlayer,
    onAssignPlayer,
    onAutoAssignRemainingPlayers,
    setNextTeamName
  });
  const { handleWingParticipationChange, handleDispatchMinigameAction } =
    createMinigameHandlers({
      hostMode,
      minigameType,
      onDispatchMinigameAction,
      onSetWingParticipation
    });
  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  return (
    <main className={containerClassName}>
      <HostPhaseBody
        hostMode={hostMode}
        roomState={roomState}
        players={players}
        teams={teams}
        assignedTeamByPlayerId={assignedTeamByPlayerId}
        teamNameByTeamId={teamNameByTeamId}
        wingParticipationByPlayerId={wingParticipationByPlayerId}
        activeRoundTeamId={activeRoundTeamId}
        activeRoundTeamName={activeRoundTeamName}
        minigameType={minigameType}
        minigameHostView={minigameHostView}
        nextTeamName={nextTeamName}
        setupMutationsDisabled={setupMutationsDisabled}
        autoAssignDisabled={autoAssignDisabled}
        assignmentDisabled={assignmentDisabled}
        addPlayerDisabled={addPlayerDisabled}
        participationDisabled={participationDisabled}
        canDispatchMinigameAction={canDispatchMinigameAction}
        sortedStandings={sortedStandings}
        timer={roomState?.timer ?? null}
        showOverridesButton={overrideDockContext.isVisible}
        overridesShowBadge={overrideDockContext.showBadge}
        onOpenOverrides={(): void => {
          setIsOverrideDockOpen(true);
        }}
        onNextTeamNameChange={setNextTeamName}
        onCreateTeamSubmit={handleCreateTeamSubmit}
        onAddPlayer={handleAddPlayer}
        onAssignPlayer={handleAssignmentChange}
        onAutoAssignRemainingPlayers={handleAutoAssignRemainingPlayers}
        onSetWingParticipation={handleWingParticipationChange}
        onPauseTimer={onPauseTimer}
        onResumeTimer={onResumeTimer}
        onExtendTimer={onExtendTimer}
        onDispatchMinigameAction={handleDispatchMinigameAction}
      />

      <HostActionBarSurface
        onNextPhase={onNextPhase}
        nextPhaseDisabled={nextPhaseDisabled}
        primaryButtonLabel={primaryButtonLabel}
      />

      {overrideDockContext.isVisible && (
        <OverrideDock
          isOpen={isOverrideDockOpen}
          showBadge={overrideDockContext.showBadge}
          panelId={overrideDockPanelId}
          onOpen={(): void => {
            setIsOverrideDockOpen(true);
          }}
          onClose={(): void => {
            setIsOverrideDockOpen(false);
          }}
        >
          <div className={styles.overridePanelContent}>
            <OverrideActionsSurface
              onSkipTurnBoundary={onSkipTurnBoundary}
              showSkipTurnBoundaryAction={overrideDockContext.showSkipTurnBoundaryAction}
              onRedoLastMutation={onRedoLastMutation}
              showRedoLastMutationAction={overrideDockContext.showRedoLastMutationAction}
              onResetGame={onResetGame}
              showResetGameAction={overrideDockContext.showResetGameAction}
            />
            <TurnOrderSurface
              orderedTeams={orderedTeams}
              isEditable={overrideDockContext.isTurnOrderEditable}
              onReorderTurnOrder={onReorderTurnOrder}
            />
            <ScoreOverrideSurface teams={teams} onAdjustTeamScore={onAdjustTeamScore} />
          </div>
        </OverrideDock>
      )}
    </main>
  );
};
