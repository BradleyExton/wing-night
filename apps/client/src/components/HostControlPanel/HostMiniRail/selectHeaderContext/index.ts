import { Phase, type RoomState } from "@wingnight/shared";

import { hostControlPanelCopy } from "../../copy";

type HeaderContext = {
  phaseTitle: string;
  phaseDescription: string;
  roundLabel: string;
  sauceLabel: string | null;
  minigameLabel: string | null;
  // The id as well as the name: the rail paints its dot in the team's own
  // colour, and a colour is looked up by id (`teamThemeByTeamId`). Null on
  // every phase that carries no active team, and on a phase that does but has
  // no id for it — the name is `"No team assigned"` there and the dot has no
  // team to be.
  activeTeamId: string | null;
  activeTeamName: string | null;
};

const selectActiveTeamId = (roomState: RoomState | null): string | null => {
  if (!roomState) {
    return null;
  }

  if (roomState.phase === Phase.MINIGAME_PLAY) {
    return roomState.activeTurnTeamId ?? roomState.activeRoundTeamId;
  }

  if (
    roomState.phase === Phase.EATING ||
    roomState.phase === Phase.MINIGAME_INTRO ||
    roomState.phase === Phase.TURN_RESULTS
  ) {
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

  // The sauce and the mini-game are what the deleted round intro screen told the
  // host. They now ride the rail on the beat that replaced it — the briefing,
  // where the host says both out loud before the team starts eating.
  const isRoundBriefingPhase = phase === Phase.MINIGAME_INTRO;
  const sauceLabel = isRoundBriefingPhase
    ? (roomState?.currentRoundConfig?.sauce ?? null)
    : null;
  const roundMinigame = roomState?.currentRoundConfig?.minigame ?? null;
  const minigameLabel =
    isRoundBriefingPhase && roundMinigame !== null
      ? hostControlPanelCopy.minigameName(roundMinigame)
      : null;

  const isActiveTeamContextPhase =
    phase === Phase.EATING ||
    phase === Phase.MINIGAME_INTRO ||
    phase === Phase.MINIGAME_PLAY ||
    phase === Phase.TURN_RESULTS;
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
    sauceLabel,
    minigameLabel,
    activeTeamId: isActiveTeamContextPhase ? activeTeamId : null,
    activeTeamName
  };
};
