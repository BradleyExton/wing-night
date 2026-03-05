import {
  Phase,
  type DisplayRoomStateSnapshot,
  type MinigameType
} from "@wingnight/shared";

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

type StageViewModel = {
  phase: Phase | null;
  stageMode: StageRenderMode;
  gameConfig: DisplayRoomStateSnapshot["gameConfig"];
  currentRoundConfig: DisplayRoomStateSnapshot["currentRoundConfig"];
  minigameType: MinigameType | null;
  teamCount: number;
  teamNames: string[];
  activeTeamName: string | null;
  shouldRenderTeamTurnContext: boolean;
  minigameDisplayView: DisplayRoomStateSnapshot["minigameDisplayView"];
  eatingTimerSnapshot: NonNullable<DisplayRoomStateSnapshot["timer"]> | null;
  fallbackEatingSeconds: number | null;
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

  const activeTeamName = activeRoundTeamName ?? activeTurnTeamName;
  const shouldRenderTeamTurnContext =
    activeTeamName !== null &&
    (stageMode === "eating" ||
      stageMode === "minigame_intro" ||
      stageMode === "minigame_play" ||
      stageMode === "turn_results");

  const minigameDisplayView = roomState?.minigameDisplayView ?? null;

  const eatingTimerSnapshot =
    stageMode === "eating" && roomState?.timer?.phase === Phase.EATING
      ? roomState.timer
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
    shouldRenderTeamTurnContext,
    minigameDisplayView,
    eatingTimerSnapshot,
    fallbackEatingSeconds: roomState?.gameConfig?.timers.eatingSeconds ?? null,
    hasRoomState: roomState !== null
  };
};
