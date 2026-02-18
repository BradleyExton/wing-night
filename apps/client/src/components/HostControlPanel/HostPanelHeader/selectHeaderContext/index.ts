import { Phase, type RoomState } from "@wingnight/shared";

import { hostControlPanelCopy } from "../../copy";

type HeaderContext = {
  phaseTitle: string;
  phaseDescription: string;
  roundLabel: string;
  roundIntroSauce: string | null;
  roundIntroMinigame: string | null;
  activeTeamName: string | null;
};

const selectActiveTeamId = (roomState: RoomState | null): string | null => {
  if (!roomState) {
    return null;
  }

  if (roomState.phase === Phase.MINIGAME_PLAY) {
    return roomState.activeTurnTeamId ?? roomState.activeRoundTeamId;
  }

  if (roomState.phase === Phase.EATING || roomState.phase === Phase.MINIGAME_INTRO) {
    return roomState.activeRoundTeamId;
  }

  return null;
};

export const selectHeaderContext = (
  roomState: RoomState | null,
  teamNameByTeamId: Map<string, string>
): HeaderContext => {
  const phase = roomState?.phase ?? null;

  const phaseTitle =
    phase === null
      ? hostControlPanelCopy.headerWaitingTitle
      : hostControlPanelCopy.compactPhaseLabel(phase);
  const phaseDescription =
    phase === null
      ? hostControlPanelCopy.headerWaitingDescription
      : hostControlPanelCopy.headerPhaseDescription(phase);

  const currentRound = roomState?.currentRound ?? 0;
  const totalRounds = roomState?.totalRounds ?? 0;
  const roundLabel =
    currentRound > 0 && totalRounds > 0
      ? hostControlPanelCopy.compactRoundProgressLabel(currentRound, totalRounds)
      : hostControlPanelCopy.headerPreGameLabel;

  const roundIntroSauce =
    phase === Phase.ROUND_INTRO ? (roomState?.currentRoundConfig?.sauce ?? null) : null;
  const roundIntroMinigame =
    phase === Phase.ROUND_INTRO ? (roomState?.currentRoundConfig?.minigame ?? null) : null;

  const isActiveTeamContextPhase =
    phase === Phase.EATING ||
    phase === Phase.MINIGAME_INTRO ||
    phase === Phase.MINIGAME_PLAY;
  const activeTeamId = selectActiveTeamId(roomState);

  const activeTeamName =
    isActiveTeamContextPhase && activeTeamId !== null
      ? (teamNameByTeamId.get(activeTeamId) ?? hostControlPanelCopy.noAssignedTeamLabel)
      : isActiveTeamContextPhase
        ? hostControlPanelCopy.noAssignedTeamLabel
        : null;

  return {
    phaseTitle,
    phaseDescription,
    roundLabel,
    roundIntroSauce,
    roundIntroMinigame,
    activeTeamName
  };
};
