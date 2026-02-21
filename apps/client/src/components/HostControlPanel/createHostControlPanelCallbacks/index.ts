import type { FormEvent } from "react";
import type { HostRenderMode } from "../resolveHostRenderMode";

type CreateHostControlPanelCallbacksOptions = {
  hostMode: HostRenderMode;
  nextTeamName: string;
  onCreateTeam?: (name: string) => void;
  onAssignPlayer?: (playerId: string, teamId: string | null) => void;
  onSetWingParticipation?: (playerId: string, didEat: boolean) => void;
  onRecordTriviaAttempt?: (isCorrect: boolean) => void;
  onNextTeamNameChange: (nextTeamName: string) => void;
  isTriviaMinigamePlayPhase: boolean;
};

type HostControlPanelCallbacks = {
  handleCreateTeamSubmit: (event: FormEvent<HTMLFormElement>) => void;
  handleAssignmentChange: (playerId: string, selectedTeamId: string) => void;
  handleWingParticipationChange: (playerId: string, didEat: boolean) => void;
  handleRecordTriviaAttempt: (isCorrect: boolean) => void;
};

export const createHostControlPanelCallbacks = ({
  hostMode,
  nextTeamName,
  onCreateTeam,
  onAssignPlayer,
  onSetWingParticipation,
  onRecordTriviaAttempt,
  onNextTeamNameChange,
  isTriviaMinigamePlayPhase
}: CreateHostControlPanelCallbacksOptions): HostControlPanelCallbacks => {
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
    onNextTeamNameChange("");
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

  return {
    handleCreateTeamSubmit,
    handleAssignmentChange,
    handleWingParticipationChange,
    handleRecordTriviaAttempt
  };
};
