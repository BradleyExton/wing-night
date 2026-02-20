import type { FormEvent } from "react";
import {
  type MinigameHostView,
  type MinigameType,
  type Player,
  type RoomState,
  type Team
} from "@wingnight/shared";

import { CompactSummarySurface } from "../CompactSummarySurface";
import { MinigameSurface } from "../MinigameSurface";
import { PlayersSurface } from "../PlayersSurface";
import { TeamSetupSurface } from "../TeamSetupSurface";
import { TimerControlsSurface } from "../TimerControlsSurface";
import type { HostRenderMode } from "../resolveHostRenderMode";
import * as styles from "./styles";

type HostPhaseBodyProps = {
  hostMode: HostRenderMode;
  roomState: RoomState | null;
  players: Player[];
  teams: Team[];
  assignedTeamByPlayerId: Map<string, string>;
  teamNameByTeamId: Map<string, string>;
  wingParticipationByPlayerId: Record<string, boolean>;
  activeRoundTeamId: string | null;
  activeRoundTeamName: string;
  minigameType: MinigameType | null;
  minigameHostView: MinigameHostView | null;
  nextTeamName: string;
  setupMutationsDisabled: boolean;
  assignmentDisabled: boolean;
  participationDisabled: boolean;
  triviaAttemptDisabled: boolean;
  sortedStandings: Team[];
  timer: RoomState["timer"];
  onNextTeamNameChange: (nextTeamName: string) => void;
  onCreateTeamSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAssignPlayer: (playerId: string, selectedTeamId: string) => void;
  onSetWingParticipation: (playerId: string, didEat: boolean) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onExtendTimer?: (additionalSeconds: number) => void;
  onRecordTriviaAttempt: (isCorrect: boolean) => void;
};

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

export const HostPhaseBody = ({
  hostMode,
  roomState,
  players,
  teams,
  assignedTeamByPlayerId,
  teamNameByTeamId,
  wingParticipationByPlayerId,
  activeRoundTeamId,
  activeRoundTeamName,
  minigameType,
  minigameHostView,
  nextTeamName,
  setupMutationsDisabled,
  assignmentDisabled,
  participationDisabled,
  triviaAttemptDisabled,
  sortedStandings,
  timer,
  onNextTeamNameChange,
  onCreateTeamSubmit,
  onAssignPlayer,
  onSetWingParticipation,
  onPauseTimer,
  onResumeTimer,
  onExtendTimer,
  onRecordTriviaAttempt
}: HostPhaseBodyProps): JSX.Element | null => {
  switch (hostMode) {
    case "waiting":
      return null;
    case "setup":
      return (
        <div className={styles.surfaceGroup}>
          <TeamSetupSurface
            nextTeamName={nextTeamName}
            setupMutationsDisabled={setupMutationsDisabled}
            teams={teams}
            onNextTeamNameChange={onNextTeamNameChange}
            onCreateTeamSubmit={onCreateTeamSubmit}
          />
          <PlayersSurface
            mode="setup"
            players={players}
            teams={teams}
            assignedTeamByPlayerId={assignedTeamByPlayerId}
            assignmentDisabled={assignmentDisabled}
            onAssignPlayer={onAssignPlayer}
          />
        </div>
      );
    case "eating":
      return (
        <div className={styles.surfaceGroup}>
          <PlayersSurface
            mode="eating"
            players={players}
            assignedTeamByPlayerId={assignedTeamByPlayerId}
            teamNameByTeamId={teamNameByTeamId}
            wingParticipationByPlayerId={wingParticipationByPlayerId}
            activeRoundTeamId={activeRoundTeamId}
            activeRoundTeamName={activeRoundTeamName}
            participationDisabled={participationDisabled}
            onSetWingParticipation={onSetWingParticipation}
          />
          <TimerControlsSurface
            timer={timer}
            onPauseTimer={onPauseTimer}
            onResumeTimer={onResumeTimer}
            onExtendTimer={onExtendTimer}
          />
        </div>
      );
    case "minigame_intro":
    case "minigame_play":
      return (
        <MinigameSurface
          phase={hostMode === "minigame_intro" ? "intro" : "play"}
          minigameType={minigameType}
          minigameHostView={minigameHostView}
          activeTeamName={
            activeRoundTeamId === null ? null : activeRoundTeamName
          }
          teamNameByTeamId={teamNameByTeamId}
          triviaAttemptDisabled={triviaAttemptDisabled}
          onRecordTriviaAttempt={onRecordTriviaAttempt}
        />
      );
    case "compact":
      return roomState ? (
        <div className={styles.surfaceGroup}>
          <CompactSummarySurface sortedStandings={sortedStandings} />
        </div>
      ) : null;
    default:
      return assertUnreachable(hostMode);
  }
};
