import type { FormEvent } from "react";
import type { SerializableValue } from "@wingnight/minigames-core";
import type { RoomState } from "@wingnight/shared";

import type { HostRenderMode } from "../resolveHostRenderMode";

type SetupHandlersOptions = {
  hostMode: HostRenderMode;
  nextTeamName: string;
  onCreateTeam?: (name: string) => void;
  onAddPlayer?: (name: string) => void;
  onAssignPlayer?: (playerId: string, teamId: string | null) => void;
  onAutoAssignRemainingPlayers?: () => void;
  setNextTeamName: (nextTeamName: string) => void;
};

type SetupHandlers = {
  handleCreateTeamSubmit: (event: FormEvent<HTMLFormElement>) => void;
  handleAssignmentChange: (playerId: string, selectedTeamId: string) => void;
  handleAddPlayer: (name: string) => void;
  handleAutoAssignRemainingPlayers: () => void;
};

type MinigameHandlersOptions = {
  hostMode: HostRenderMode;
  minigameType: NonNullable<RoomState["currentRoundConfig"]>["minigame"] | null;
  onDispatchMinigameAction?: (
    minigameId: NonNullable<RoomState["currentRoundConfig"]>["minigame"],
    actionType: string,
    actionPayload: SerializableValue
  ) => void;
  onSetWingParticipation?: (playerId: string, didEat: boolean) => void;
};

type MinigameHandlers = {
  handleWingParticipationChange: (playerId: string, didEat: boolean) => void;
  handleDispatchMinigameAction: (actionType: string, actionPayload: SerializableValue) => void;
};

export const createSetupHandlers = ({
  hostMode,
  nextTeamName,
  onCreateTeam,
  onAddPlayer,
  onAssignPlayer,
  onAutoAssignRemainingPlayers,
  setNextTeamName
}: SetupHandlersOptions): SetupHandlers => {
  return {
    handleCreateTeamSubmit: (event): void => {
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
    },
    handleAssignmentChange: (playerId, selectedTeamId): void => {
      if (!onAssignPlayer || hostMode !== "setup") {
        return;
      }

      onAssignPlayer(playerId, selectedTeamId.length === 0 ? null : selectedTeamId);
    },
    handleAddPlayer: (name): void => {
      if (!onAddPlayer || hostMode !== "setup") {
        return;
      }

      const normalizedPlayerName = name.trim();

      if (normalizedPlayerName.length === 0) {
        return;
      }

      onAddPlayer(normalizedPlayerName);
    },
    handleAutoAssignRemainingPlayers: (): void => {
      if (!onAutoAssignRemainingPlayers || hostMode !== "setup") {
        return;
      }

      onAutoAssignRemainingPlayers();
    }
  };
};

export const createMinigameHandlers = ({
  hostMode,
  minigameType,
  onDispatchMinigameAction,
  onSetWingParticipation
}: MinigameHandlersOptions): MinigameHandlers => {
  return {
    handleWingParticipationChange: (playerId, didEat): void => {
      if (!onSetWingParticipation || hostMode !== "eating") {
        return;
      }

      onSetWingParticipation(playerId, didEat);
    },
    handleDispatchMinigameAction: (actionType, actionPayload): void => {
      if (
        onDispatchMinigameAction === undefined ||
        hostMode !== "minigame_play" ||
        minigameType === null
      ) {
        return;
      }

      onDispatchMinigameAction(minigameType, actionType, actionPayload);
    }
  };
};
