import { Phase, SESSION_MODES, type RoomState } from "@wingnight/shared";

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
  const isQuickPlay = roomState?.sessionMode === SESSION_MODES.QUICK_PLAY;

  const phaseTitle =
    phase === null
      ? hostControlPanelCopy.headerWaitingTitle
      : hostControlPanelCopy.compactPhaseLabel(phase);
  const phaseDescription =
    phase === null
      ? hostControlPanelCopy.headerWaitingDescription
      : hostControlPanelCopy.headerPhaseDescription(phase, { isQuickPlay });

  const currentRound = roomState?.currentRound ?? 0;
  const totalRounds = roomState?.totalRounds ?? 0;
  const roundLabel =
    currentRound > 0 && totalRounds > 0
      ? isQuickPlay
        ? hostControlPanelCopy.quickPlayGameProgressLabel(currentRound, totalRounds)
        : hostControlPanelCopy.compactRoundProgressLabel(currentRound, totalRounds)
      : hostControlPanelCopy.headerPreGameLabel;

  // The rail says the same four things on every phase — round, sauce, game,
  // team — so the host never relearns it between beats (DESIGN.md §2.0A). It
  // used to carry the sauce and the game on the briefing alone and drop them on
  // every other phase. Before a round exists the game slot holds a placeholder
  // rather than vanishing.
  const roundConfig = roomState?.currentRoundConfig ?? null;
  // Quick Play rounds carry a placeholder sauce the room never eats, so the
  // rail leaves that slot out rather than announcing it.
  const sauceLabel = isQuickPlay ? null : (roundConfig?.sauce ?? null);
  // The round's game, else the game actually running (the dev sandbox plays a
  // game with no round around it), else the placeholder.
  const railMinigame = roundConfig?.minigame ?? roomState?.minigameHostView?.minigame ?? null;
  const minigameLabel =
    railMinigame !== null
      ? hostControlPanelCopy.minigameName(railMinigame)
      : hostControlPanelCopy.railNoGameLabel;

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
