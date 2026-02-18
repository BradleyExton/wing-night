import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Phase, type RoomState } from "@wingnight/shared";

import { CompactSummarySurface } from "./CompactSummarySurface";
import { HostPanelHeader } from "./HostPanelHeader";
import { hostControlPanelCopy } from "./copy";
import { PlayersSurface } from "./PlayersSurface";
import * as styles from "./styles";
import { TeamSetupSurface } from "./TeamSetupSurface";
import { TimerControlsSurface } from "./TimerControlsSurface";

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
  onExtendTimer
}: HostControlPanelProps): JSX.Element => {
  const [nextTeamName, setNextTeamName] = useState("");

  const assignedTeamByPlayerId = useMemo(() => {
    const map = new Map<string, string>();
    if (!roomState) {
      return map;
    }
    for (const team of roomState.teams) {
      for (const playerId of team.playerIds) {
        map.set(playerId, team.id);
      }
    }
    return map;
  }, [roomState]);

  const teamNameByTeamId = useMemo(() => {
    const map = new Map<string, string>();
    if (!roomState) {
      return map;
    }
    for (const team of roomState.teams) {
      map.set(team.id, team.name);
    }
    return map;
  }, [roomState]);

  const players = roomState?.players ?? [];
  const teams = roomState?.teams ?? EMPTY_TEAMS;
  const phase = roomState?.phase ?? null;
  const isSetupPhase = phase === Phase.SETUP;
  const isEatingPhase = phase === Phase.EATING;
  const isMinigameIntroPhase = phase === Phase.MINIGAME_INTRO;
  const isMinigamePlayPhase = phase === Phase.MINIGAME_PLAY;
  const isCompactSummaryPhase =
    phase === Phase.INTRO ||
    phase === Phase.ROUND_INTRO ||
    phase === Phase.ROUND_RESULTS ||
    phase === Phase.FINAL_RESULTS;
  const isTriviaMinigamePlayPhase =
    isMinigamePlayPhase && roomState?.currentRoundConfig?.minigame === "TRIVIA";

  const wingParticipationByPlayerId = roomState?.wingParticipationByPlayerId ?? {};
  const activeRoundTeamId = roomState?.activeRoundTeamId ?? null;
  const activeRoundTeamName =
    activeRoundTeamId !== null
      ? (teamNameByTeamId.get(activeRoundTeamId) ??
        hostControlPanelCopy.noAssignedTeamLabel)
      : hostControlPanelCopy.noAssignedTeamLabel;
  const turnProgressLabel =
    roomState &&
    roomState.roundTurnCursor >= 0 &&
    roomState.turnOrderTeamIds.length > 0
      ? hostControlPanelCopy.turnProgressLabel(
          roomState.roundTurnCursor + 1,
          roomState.turnOrderTeamIds.length
        )
      : null;
  const currentTriviaPrompt = roomState?.currentTriviaPrompt ?? null;
  const activeTurnTeamId = roomState?.activeTurnTeamId ?? null;
  const activeTurnTeamName =
    activeTurnTeamId !== null
      ? (teamNameByTeamId.get(activeTurnTeamId) ??
        hostControlPanelCopy.noAssignedTeamLabel)
      : hostControlPanelCopy.noAssignedTeamLabel;

  const setupMutationsDisabled = onCreateTeam === undefined || !isSetupPhase;
  const assignmentDisabled = onAssignPlayer === undefined || !isSetupPhase;
  const participationDisabled = onSetWingParticipation === undefined || !isEatingPhase;
  const triviaAttemptDisabled =
    onRecordTriviaAttempt === undefined ||
    !isTriviaMinigamePlayPhase ||
    activeTurnTeamId === null ||
    currentTriviaPrompt === null;

  const shouldRenderSetupSections = isSetupPhase || isMinigameIntroPhase;
  const shouldRenderPlayersSection =
    shouldRenderSetupSections || isEatingPhase || isMinigamePlayPhase;

  const currentRoundConfig = roomState?.currentRoundConfig ?? null;
  const sortedStandings = useMemo(() => {
    return [...teams].sort((leftTeam, rightTeam) => {
      if (rightTeam.totalScore !== leftTeam.totalScore) {
        return rightTeam.totalScore - leftTeam.totalScore;
      }

      return leftTeam.name.localeCompare(rightTeam.name);
    });
  }, [teams]);
  const phaseAdvanceHint =
    phase !== null ? hostControlPanelCopy.phaseAdvanceHint(phase) : null;

  const handleCreateTeamSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!onCreateTeam || !isSetupPhase) {
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
    if (!onAssignPlayer || !isSetupPhase) {
      return;
    }

    onAssignPlayer(playerId, selectedTeamId.length === 0 ? null : selectedTeamId);
  };

  const handleWingParticipationChange = (playerId: string, didEat: boolean): void => {
    if (!onSetWingParticipation || !isEatingPhase) {
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

  return (
    <main className={styles.container}>
      <div className={styles.panel}>
        <HostPanelHeader roomState={roomState} teamNameByTeamId={teamNameByTeamId} />

        <div className={styles.controlsRow}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={onNextPhase}
            disabled={onNextPhase === undefined}
          >
            {hostControlPanelCopy.nextPhaseButtonLabel}
          </button>
        </div>

        {roomState && phaseAdvanceHint !== null && phase !== Phase.SETUP && (
          <p className={styles.phaseNotice}>{phaseAdvanceHint}</p>
        )}

        {isCompactSummaryPhase && roomState && phase !== null && (
          <CompactSummarySurface
            phase={phase}
            currentRound={roomState.currentRound}
            totalRounds={roomState.totalRounds}
            currentRoundConfig={currentRoundConfig}
            sortedStandings={sortedStandings}
          />
        )}

        {!isCompactSummaryPhase && (
          <>
            {shouldRenderSetupSections && (
              <TeamSetupSurface
                nextTeamName={nextTeamName}
                setupMutationsDisabled={setupMutationsDisabled}
                teams={teams}
                onNextTeamNameChange={setNextTeamName}
                onCreateTeamSubmit={handleCreateTeamSubmit}
              />
            )}

            {shouldRenderPlayersSection && (
              <PlayersSurface
                players={players}
                teams={teams}
                assignedTeamByPlayerId={assignedTeamByPlayerId}
                teamNameByTeamId={teamNameByTeamId}
                isSetupPhase={isSetupPhase}
                isEatingPhase={isEatingPhase}
                isMinigameIntroPhase={isMinigameIntroPhase}
                isTriviaMinigamePlayPhase={isTriviaMinigamePlayPhase}
                wingParticipationByPlayerId={wingParticipationByPlayerId}
                currentTriviaPrompt={currentTriviaPrompt}
                activeRoundTeamId={activeRoundTeamId}
                activeRoundTeamName={activeRoundTeamName}
                turnProgressLabel={turnProgressLabel}
                activeTurnTeamName={activeTurnTeamName}
                assignmentDisabled={assignmentDisabled}
                participationDisabled={participationDisabled}
                triviaAttemptDisabled={triviaAttemptDisabled}
                onAssignPlayer={handleAssignmentChange}
                onSetWingParticipation={handleWingParticipationChange}
                onRecordTriviaAttempt={handleRecordTriviaAttempt}
              />
            )}

            {isEatingPhase && (
              <TimerControlsSurface
                isEatingPhase={isEatingPhase}
                timer={roomState?.timer ?? null}
                onPauseTimer={onPauseTimer}
                onResumeTimer={onResumeTimer}
                onExtendTimer={onExtendTimer}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
};
