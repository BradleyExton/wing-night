import { useEffect, useId, useMemo, useState } from "react";
import { type RoomState } from "@wingnight/shared";

import { ContentFatalState } from "../ContentFatalState";
import { createHostControlPanelCallbacks } from "./createHostControlPanelCallbacks";
import { HostActionBarSurface } from "./HostActionBarSurface";
import { HostPanelHeader } from "./HostPanelHeader";
import { OverrideActionsSurface } from "./OverrideActionsSurface";
import { OverrideDock } from "./OverrideDock";
import { HostPhaseBody } from "./HostPhaseBody";
import { resolveOrderedTeams, resolveSortedStandings } from "./roomTeamSelectors";
import { selectHostControlPanelState } from "./selectHostControlPanelState";
import { ScoreOverrideSurface } from "./ScoreOverrideSurface";
import { selectOverrideDockContext } from "./selectOverrideDockContext";
import { selectHostTeamMaps } from "./selectHostTeamMaps";
import { TurnOrderSurface } from "./TurnOrderSurface";
import * as styles from "./styles";

type HostControlPanelProps = {
  roomState: RoomState | null;
  onNextPhase?: () => void;
  onCreateTeam?: (name: string) => void;
  onAssignPlayer?: (playerId: string, teamId: string | null) => void;
  onSetWingParticipation?: (playerId: string, didEat: boolean) => void;
  onRecordTriviaAttempt?: (isCorrect: boolean) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onExtendTimer?: (additionalSeconds: number) => void;
  onReorderTurnOrder?: (teamIds: string[]) => void;
  onSkipTurnBoundary?: () => void;
  onAdjustTeamScore?: (teamId: string, delta: number) => void;
  onResetGame?: () => void;
  onRedoLastMutation?: () => void;
};

export const HostControlPanel = ({
  roomState,
  onNextPhase,
  onCreateTeam,
  onAssignPlayer,
  onSetWingParticipation,
  onRecordTriviaAttempt,
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

  const {
    players,
    teams,
    fatalError,
    hostMode,
    minigameHostView,
    isTriviaMinigamePlayPhase,
    wingParticipationByPlayerId,
    activeRoundTeamId,
    activeRoundTeamName,
    setupMutationsDisabled,
    assignmentDisabled,
    participationDisabled,
    triviaAttemptDisabled,
    nextPhaseDisabled,
    phaseAdvanceHint
  } = useMemo(() => {
    return selectHostControlPanelState({
      roomState,
      teamNameByTeamId,
      onCreateTeam,
      onAssignPlayer,
      onSetWingParticipation,
      onRecordTriviaAttempt,
      onNextPhase
    });
  }, [
    roomState,
    teamNameByTeamId,
    onCreateTeam,
    onAssignPlayer,
    onSetWingParticipation,
    onRecordTriviaAttempt,
    onNextPhase
  ]);

  const sortedStandings = useMemo(() => resolveSortedStandings(teams), [teams]);
  const orderedTeams = useMemo(() => resolveOrderedTeams(roomState), [roomState]);
  const overrideDockContext = useMemo(() => {
    return selectOverrideDockContext(roomState);
  }, [roomState]);

  useEffect(() => {
    if (!overrideDockContext.isVisible && isOverrideDockOpen) {
      setIsOverrideDockOpen(false);
    }
  }, [isOverrideDockOpen, overrideDockContext.isVisible]);

  const {
    handleCreateTeamSubmit,
    handleAssignmentChange,
    handleWingParticipationChange,
    handleRecordTriviaAttempt
  } = useMemo(() => {
    return createHostControlPanelCallbacks({
      hostMode,
      nextTeamName,
      onCreateTeam,
      onAssignPlayer,
      onSetWingParticipation,
      onRecordTriviaAttempt,
      onNextTeamNameChange: setNextTeamName,
      isTriviaMinigamePlayPhase
    });
  }, [
    hostMode,
    nextTeamName,
    onCreateTeam,
    onAssignPlayer,
    onSetWingParticipation,
    onRecordTriviaAttempt,
    isTriviaMinigamePlayPhase
  ]);

  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  return (
    <main className={styles.container}>
      <div className={styles.panel}>
        <HostPanelHeader roomState={roomState} teamNameByTeamId={teamNameByTeamId} />

        <HostActionBarSurface
          onNextPhase={onNextPhase}
          nextPhaseDisabled={nextPhaseDisabled}
        />

        {roomState && phaseAdvanceHint !== null && hostMode !== "setup" && (
          <p className={styles.phaseNotice}>{phaseAdvanceHint}</p>
        )}

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
          minigameHostView={minigameHostView}
          nextTeamName={nextTeamName}
          setupMutationsDisabled={setupMutationsDisabled}
          assignmentDisabled={assignmentDisabled}
          participationDisabled={participationDisabled}
          triviaAttemptDisabled={triviaAttemptDisabled}
          sortedStandings={sortedStandings}
          timer={roomState?.timer ?? null}
          onNextTeamNameChange={setNextTeamName}
          onCreateTeamSubmit={handleCreateTeamSubmit}
          onAssignPlayer={handleAssignmentChange}
          onSetWingParticipation={handleWingParticipationChange}
          onPauseTimer={onPauseTimer}
          onResumeTimer={onResumeTimer}
          onExtendTimer={onExtendTimer}
          onRecordTriviaAttempt={handleRecordTriviaAttempt}
        />
      </div>

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
