import {
  Phase,
  type DisplayRoomStateSnapshot,
  type MinigameType
} from "@wingnight/shared";

import {
  resolveMinigameBriefingContent,
  type MinigameBriefingContent
} from "../../../../copy/minigameBriefings";

export type StageRenderMode =
  | "setup"
  | "setup_locked"
  | "round_intro"
  | "eating"
  | "minigame_intro"
  | "minigame_play"
  | "turn_results"
  | "round_results"
  | "final_results"
  | "fallback";

export type TurnTileStatus = "done" | "just-done" | "upcoming";

export type TurnTile = {
  teamId: string;
  teamName: string;
  status: TurnTileStatus;
};

export type RoundResultsRow = {
  teamId: string;
  teamName: string;
  wingPoints: number;
  minigamePoints: number;
  totalPoints: number;
};

type StageViewModel = {
  phase: Phase | null;
  stageMode: StageRenderMode;
  gameConfig: DisplayRoomStateSnapshot["gameConfig"];
  currentRoundConfig: DisplayRoomStateSnapshot["currentRoundConfig"];
  minigameType: MinigameType | null;
  teamCount: number;
  teamNames: string[];
  activeTeamName: string | null;
  activeTeamPlayerNames: string[];
  shouldRenderTeamTurnContext: boolean;
  minigameBriefingContent: MinigameBriefingContent | null;
  minigameDisplayView: DisplayRoomStateSnapshot["minigameDisplayView"];
  eatingTimerSnapshot: NonNullable<DisplayRoomStateSnapshot["timer"]> | null;
  fallbackEatingSeconds: number | null;
  turnTiles: TurnTile[];
  nextTurnTeamName: string | null;
  roundResultsRows: RoundResultsRow[];
  roundResultsTopTeamId: string | null;
  hasRoomState: boolean;
};

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

const resolveStageRenderMode = (phase: Phase | null): StageRenderMode => {
  switch (phase) {
    case Phase.SETUP:
      return "setup";
    case Phase.INTRO:
      return "setup_locked";
    case Phase.ROUND_INTRO:
      return "round_intro";
    case Phase.EATING:
      return "eating";
    case Phase.MINIGAME_INTRO:
      return "minigame_intro";
    case Phase.MINIGAME_PLAY:
      return "minigame_play";
    case Phase.TURN_RESULTS:
      return "turn_results";
    case Phase.ROUND_RESULTS:
      return "round_results";
    case Phase.FINAL_RESULTS:
      return "final_results";
    case null:
      return "fallback";
    default:
      return assertUnreachable(phase);
  }
};

export const resolveStageViewModel = (
  roomState: DisplayRoomStateSnapshot | null
): StageViewModel => {
  const phase = roomState?.phase ?? null;
  const stageMode = resolveStageRenderMode(phase);
  const gameConfig = roomState?.gameConfig ?? null;
  const currentRoundConfig = roomState?.currentRoundConfig ?? null;
  const minigameType =
    roomState?.minigameDisplayView?.minigame ?? currentRoundConfig?.minigame ?? null;

  const activeRoundTeamId = roomState?.activeRoundTeamId ?? null;
  const activeTurnTeamId = roomState?.activeTurnTeamId ?? null;

  const activeRoundTeamName =
    activeRoundTeamId !== null
      ? (roomState?.teams.find((team) => team.id === activeRoundTeamId)?.name ?? null)
      : null;
  const activeTurnTeamName =
    activeTurnTeamId !== null
      ? (roomState?.teams.find((team) => team.id === activeTurnTeamId)?.name ?? null)
      : null;

  const activeTeamId = activeRoundTeamId ?? activeTurnTeamId;
  const activeTeamName = activeRoundTeamName ?? activeTurnTeamName;
  const activeTeam =
    activeTeamId !== null
      ? (roomState?.teams.find((team) => team.id === activeTeamId) ?? null)
      : null;
  const playerNameByPlayerId = new Map(
    (roomState?.players ?? []).map((player) => [player.id, player.name] as const)
  );
  const activeTeamPlayerNames =
    activeTeam?.playerIds
      .map((playerId) => playerNameByPlayerId.get(playerId) ?? null)
      .filter((playerName): playerName is string => playerName !== null) ?? [];
  const shouldRenderTeamTurnContext =
    activeTeamName !== null &&
    (stageMode === "eating" ||
      stageMode === "minigame_intro" ||
      stageMode === "minigame_play" ||
      stageMode === "turn_results");

  const minigameDisplayView = roomState?.minigameDisplayView ?? null;
  const minigameBriefingContent = resolveMinigameBriefingContent(minigameType, gameConfig);

  const eatingTimerSnapshot =
    stageMode === "eating" && roomState?.timer?.phase === Phase.EATING
      ? roomState.timer
      : null;

  const turnOrderTeamIds = roomState?.turnOrderTeamIds ?? [];
  const completedRoundTurnTeamIds = roomState?.completedRoundTurnTeamIds ?? [];
  const completedSet = new Set(completedRoundTurnTeamIds);
  const teamNameByTeamId = new Map(
    (roomState?.teams ?? []).map((team) => [team.id, team.name] as const)
  );

  const turnTiles: TurnTile[] = turnOrderTeamIds.map((teamId) => {
    const status: TurnTileStatus =
      stageMode === "turn_results" && teamId === activeTeamId
        ? "just-done"
        : completedSet.has(teamId)
          ? "done"
          : "upcoming";
    return {
      teamId,
      teamName: teamNameByTeamId.get(teamId) ?? teamId,
      status
    };
  });

  const activeTeamIndex =
    activeTeamId !== null ? turnOrderTeamIds.indexOf(activeTeamId) : -1;
  let nextTurnTeamName: string | null = null;
  for (
    let cursor = activeTeamIndex + 1;
    cursor < turnOrderTeamIds.length;
    cursor += 1
  ) {
    const candidateTeamId = turnOrderTeamIds[cursor];
    if (!completedSet.has(candidateTeamId)) {
      nextTurnTeamName = teamNameByTeamId.get(candidateTeamId) ?? null;
      break;
    }
  }

  const wingPointsByTeamId = roomState?.pendingWingPointsByTeamId ?? {};
  const minigamePointsByTeamId = roomState?.pendingMinigamePointsByTeamId ?? {};
  const roundResultsRows: RoundResultsRow[] = (roomState?.teams ?? [])
    .map((team) => {
      const wingPoints = wingPointsByTeamId[team.id] ?? 0;
      const minigamePoints = minigamePointsByTeamId[team.id] ?? 0;
      return {
        teamId: team.id,
        teamName: team.name,
        wingPoints,
        minigamePoints,
        totalPoints: wingPoints + minigamePoints
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.teamName.localeCompare(b.teamName);
    });
  const roundResultsTopTeamId =
    roundResultsRows.length > 0 && roundResultsRows[0].totalPoints > 0
      ? roundResultsRows[0].teamId
      : null;

  return {
    phase,
    stageMode,
    gameConfig,
    currentRoundConfig,
    minigameType,
    teamCount: roomState?.teams.length ?? 0,
    teamNames: roomState?.teams.map((team) => team.name) ?? [],
    activeTeamName,
    activeTeamPlayerNames,
    shouldRenderTeamTurnContext,
    minigameBriefingContent,
    minigameDisplayView,
    eatingTimerSnapshot,
    fallbackEatingSeconds: roomState?.gameConfig?.timers.eatingSeconds ?? null,
    turnTiles,
    nextTurnTeamName,
    roundResultsRows,
    roundResultsTopTeamId,
    hasRoomState: roomState !== null
  };
};
