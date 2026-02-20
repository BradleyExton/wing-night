import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { type RoomState } from "@wingnight/shared";

import { ContentFatalState } from "../ContentFatalState";
import { HostActionBarSurface } from "./HostActionBarSurface";
import { HostPanelHeader } from "./HostPanelHeader";
import { OverrideActionsSurface } from "./OverrideActionsSurface";
import { OverrideDock } from "./OverrideDock";
import { hostControlPanelCopy } from "./copy";
import { HostPhaseBody } from "./HostPhaseBody";
import { resolveHostRenderMode } from "./resolveHostRenderMode";
import { resolveOrderedTeams, resolveSortedStandings } from "./roomTeamSelectors";
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

const EMPTY_TEAMS: RoomState["teams"] = [];

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
  const isTriviaMinigamePlayPhase =
    hostMode === "minigame_play" && minigameHostView?.minigame === "TRIVIA";

  const wingParticipationByPlayerId = roomState?.wingParticipationByPlayerId ?? {};
  const activeRoundTeamId = roomState?.activeRoundTeamId ?? null;
  const activeRoundTeamName =
    activeRoundTeamId !== null
      ? (teamNameByTeamId.get(activeRoundTeamId) ??
        hostControlPanelCopy.noAssignedTeamLabel)
      : hostControlPanelCopy.noAssignedTeamLabel;
  const currentTriviaPrompt =
    minigameHostView?.currentPrompt ?? roomState?.currentTriviaPrompt ?? null;
  const activeTurnTeamId =
    minigameHostView?.activeTurnTeamId ?? roomState?.activeTurnTeamId ?? null;

  const setupMutationsDisabled = onCreateTeam === undefined || hostMode !== "setup";
  const assignmentDisabled = onAssignPlayer === undefined || hostMode !== "setup";
  const participationDisabled = onSetWingParticipation === undefined || hostMode !== "eating";
  const triviaAttemptDisabled =
    onRecordTriviaAttempt === undefined ||
    !isTriviaMinigamePlayPhase ||
    activeTurnTeamId === null ||
    currentTriviaPrompt === null ||
    (minigameHostView?.attemptsRemaining ?? 0) <= 0;
  const nextPhaseDisabled =
    onNextPhase === undefined || roomState?.canAdvancePhase !== true;

  const sortedStandings = useMemo(() => resolveSortedStandings(teams), [teams]);
  const orderedTeams = useMemo(() => resolveOrderedTeams(roomState), [roomState]);
  const overrideDockContext = useMemo(() => {
    return selectOverrideDockContext(roomState);
  }, [roomState]);

  const phaseAdvanceHint =
    phase !== null ? hostControlPanelCopy.phaseAdvanceHint(phase) : null;
  const containerClassName = isMinigameTakeover
    ? styles.takeoverContainer
    : styles.container;
  const panelClassName = isMinigameTakeover ? styles.takeoverPanel : styles.panel;

  useEffect(() => {
    if (!overrideDockContext.isVisible && isOverrideDockOpen) {
      setIsOverrideDockOpen(false);
    }
  }, [isOverrideDockOpen, overrideDockContext.isVisible]);

  const handleCreateTeamSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!onCreateTeam || hostMode !== "setup") {
      return;
    }

    const normalizedTeamName = nextTeamName.trim();

    if (normalizedTeamName.length === 0) {
      return;
    }

    onCreateTeam(normalizedTeamName);
    setNextTeamName("");
  };

  const handleAssignmentChange = (playerId: string, selectedTeamId: string): void => {
    if (!onAssignPlayer || hostMode !== "setup") {
      return;
    }

    onAssignPlayer(playerId, selectedTeamId.length === 0 ? null : selectedTeamId);
  };

  const handleWingParticipationChange = (playerId: string, didEat: boolean): void => {
    if (!onSetWingParticipation || hostMode !== "eating") {
      return;
    }

    onSetWingParticipation(playerId, didEat);
  };

  const handleRecordTriviaAttempt = (isCorrect: boolean): void => {
    if (!onRecordTriviaAttempt || !isTriviaMinigamePlayPhase) {
      return;
    }

    onRecordTriviaAttempt(isCorrect);
  };

  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  return (
    <main className={containerClassName}>
      <div className={panelClassName}>
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
          minigameType={minigameType}
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
