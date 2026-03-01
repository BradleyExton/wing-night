import {
  Phase,
  type DisplayRoomStateSnapshot,
  type MinigameType
} from "@wingnight/shared";

export type StageRenderMode = "setup" | "round_intro" | "eating" | "minigame" | "fallback";

type StageViewModel = {
  phase: Phase | null;
  stageMode: StageRenderMode;
  gameConfig: DisplayRoomStateSnapshot["gameConfig"];
  currentRoundConfig: DisplayRoomStateSnapshot["currentRoundConfig"];
  minigameType: MinigameType | null;
  minigamePhase: "intro" | "play" | null;
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
    case Phase.ROUND_INTRO:
      return "round_intro";
    case Phase.EATING:
      return "eating";
    case Phase.MINIGAME_INTRO:
    case Phase.MINIGAME_PLAY:
      return "minigame";
    case null:
    case Phase.INTRO:
    case Phase.ROUND_RESULTS:
    case Phase.FINAL_RESULTS:
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
  const minigamePhase =
    phase === Phase.MINIGAME_INTRO ? "intro" : phase === Phase.MINIGAME_PLAY ? "play" : null;

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
    activeTeamName !== null && (stageMode === "eating" || stageMode === "minigame");

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
    minigamePhase,
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
