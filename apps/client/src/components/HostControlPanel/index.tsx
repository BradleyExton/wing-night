import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Phase, type RoomState } from "@wingnight/shared";

import { CompactSummarySurface } from "./CompactSummarySurface";
import { HostPanelHeader } from "./HostPanelHeader";
import { hostControlPanelCopy } from "./copy";
import { MinigameSurface } from "./MinigameSurface";
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
type HostRenderMode =
  | "waiting"
  | "setup"
  | "eating"
  | "minigame_intro"
  | "minigame_play"
  | "compact";

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

const resolveHostRenderMode = (phase: Phase | null): HostRenderMode => {
  switch (phase) {
    case null:
      return "waiting";
    case Phase.SETUP:
      return "setup";
    case Phase.EATING:
      return "eating";
    case Phase.MINIGAME_INTRO:
      return "minigame_intro";
    case Phase.MINIGAME_PLAY:
      return "minigame_play";
    case Phase.INTRO:
    case Phase.ROUND_INTRO:
    case Phase.ROUND_RESULTS:
    case Phase.FINAL_RESULTS:
      return "compact";
    default:
      return assertUnreachable(phase);
  }
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
  const hostMode = resolveHostRenderMode(phase);
  const minigameHostView = roomState?.minigameHostView ?? null;
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
    currentTriviaPrompt === null;

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

  const renderPhaseBody = (): JSX.Element | null => {
    switch (hostMode) {
      case "waiting":
        return null;
      case "setup":
        return (
          <>
            <TeamSetupSurface
              nextTeamName={nextTeamName}
              setupMutationsDisabled={setupMutationsDisabled}
              teams={teams}
              onNextTeamNameChange={setNextTeamName}
              onCreateTeamSubmit={handleCreateTeamSubmit}
            />
            <PlayersSurface
              mode="setup"
              players={players}
              teams={teams}
              assignedTeamByPlayerId={assignedTeamByPlayerId}
              assignmentDisabled={assignmentDisabled}
              onAssignPlayer={handleAssignmentChange}
            />
          </>
        );
      case "eating":
        return (
          <>
            <PlayersSurface
              mode="eating"
              players={players}
              teams={teams}
              assignedTeamByPlayerId={assignedTeamByPlayerId}
              teamNameByTeamId={teamNameByTeamId}
              wingParticipationByPlayerId={wingParticipationByPlayerId}
              activeRoundTeamId={activeRoundTeamId}
              activeRoundTeamName={activeRoundTeamName}
              participationDisabled={participationDisabled}
              onSetWingParticipation={handleWingParticipationChange}
            />
            <TimerControlsSurface
              timer={roomState?.timer ?? null}
              onPauseTimer={onPauseTimer}
              onResumeTimer={onResumeTimer}
              onExtendTimer={onExtendTimer}
            />
          </>
        );
      case "minigame_intro":
        return null;
      case "minigame_play":
        return (
          <MinigameSurface
            minigameHostView={minigameHostView}
            teamNameByTeamId={teamNameByTeamId}
            triviaAttemptDisabled={triviaAttemptDisabled}
            onRecordTriviaAttempt={handleRecordTriviaAttempt}
          />
        );
      case "compact":
        return roomState && phase !== null ? (
          <CompactSummarySurface
            sortedStandings={sortedStandings}
          />
        ) : null;
      default:
        return assertUnreachable(hostMode);
    }
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

        {roomState && phaseAdvanceHint !== null && hostMode !== "setup" && (
          <p className={styles.phaseNotice}>{phaseAdvanceHint}</p>
        )}

        {renderPhaseBody()}
      </div>
    </main>
  );
};
