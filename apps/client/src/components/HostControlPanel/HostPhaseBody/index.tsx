import type { FormEvent } from "react";
import { Phase, type MinigameHostView, type Player, type RoomState, type Team } from "@wingnight/shared";

import { CompactSummarySurface } from "../CompactSummarySurface";
import { MinigameSurface } from "../MinigameSurface";
import { PlayersSurface } from "../PlayersSurface";
import { TeamSetupSurface } from "../TeamSetupSurface";
import { TimerControlsSurface } from "../TimerControlsSurface";
import { TurnOrderSurface } from "../TurnOrderSurface";
import type { HostRenderMode } from "../resolveHostRenderMode";
import * as styles from "./styles";

type HostPhaseBodyProps = {
  hostMode: HostRenderMode;
  phase: Phase | null;
  roomState: RoomState | null;
  players: Player[];
  teams: Team[];
  assignedTeamByPlayerId: Map<string, string>;
  teamNameByTeamId: Map<string, string>;
  wingParticipationByPlayerId: Record<string, boolean>;
  activeRoundTeamId: string | null;
  activeRoundTeamName: string;
  minigameHostView: MinigameHostView | null;
  nextTeamName: string;
  setupMutationsDisabled: boolean;
  assignmentDisabled: boolean;
  participationDisabled: boolean;
  triviaAttemptDisabled: boolean;
  sortedStandings: Team[];
  orderedTeams: Team[];
  timer: RoomState["timer"];
  onNextTeamNameChange: (nextTeamName: string) => void;
  onCreateTeamSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAssignPlayer: (playerId: string, selectedTeamId: string) => void;
  onSetWingParticipation: (playerId: string, didEat: boolean) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onExtendTimer?: (additionalSeconds: number) => void;
  onRecordTriviaAttempt: (isCorrect: boolean) => void;
  onReorderTurnOrder?: (teamIds: string[]) => void;
};

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

void styles;

export const HostPhaseBody = ({
  hostMode,
  phase,
  roomState,
  players,
  teams,
  assignedTeamByPlayerId,
  teamNameByTeamId,
  wingParticipationByPlayerId,
  activeRoundTeamId,
  activeRoundTeamName,
  minigameHostView,
  nextTeamName,
  setupMutationsDisabled,
  assignmentDisabled,
  participationDisabled,
  triviaAttemptDisabled,
  sortedStandings,
  orderedTeams,
  timer,
  onNextTeamNameChange,
  onCreateTeamSubmit,
  onAssignPlayer,
  onSetWingParticipation,
  onPauseTimer,
  onResumeTimer,
  onExtendTimer,
  onRecordTriviaAttempt,
  onReorderTurnOrder
}: HostPhaseBodyProps): JSX.Element | null => {
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
            onSetWingParticipation={onSetWingParticipation}
          />
          <TimerControlsSurface
            timer={timer}
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
          onRecordTriviaAttempt={onRecordTriviaAttempt}
        />
      );
    case "compact":
      return roomState && phase !== null ? (
        <>
          {phase === Phase.ROUND_INTRO && (
            <TurnOrderSurface
              orderedTeams={orderedTeams}
              onReorderTurnOrder={onReorderTurnOrder}
            />
          )}
          <CompactSummarySurface sortedStandings={sortedStandings} />
        </>
      ) : null;
    default:
      return assertUnreachable(hostMode);
  }
};
