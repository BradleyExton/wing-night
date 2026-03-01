import { Phase, type MinigameType, type RoomState } from "@wingnight/shared";

export type StageRenderMode = "round_intro" | "eating" | "minigame" | "fallback";

export type StageViewModel = {
  phase: Phase | null;
  stageMode: StageRenderMode;
  currentRoundConfig: RoomState["currentRoundConfig"];
  minigameType: MinigameType | null;
  minigamePhase: "intro" | "play" | null;
  activeTeamName: string | null;
  shouldRenderTeamTurnContext: boolean;
  minigameDisplayView: RoomState["minigameDisplayView"];
  eatingTimerSnapshot: NonNullable<RoomState["timer"]> | null;
  fallbackEatingSeconds: number | null;
  hasRoomState: boolean;
};

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

const resolveStageRenderMode = (phase: Phase | null): StageRenderMode => {
  switch (phase) {
    case Phase.ROUND_INTRO:
      return "round_intro";
    case Phase.EATING:
      return "eating";
    case Phase.MINIGAME_INTRO:
    case Phase.MINIGAME_PLAY:
      return "minigame";
    case null:
    case Phase.SETUP:
    case Phase.INTRO:
    case Phase.ROUND_RESULTS:
    case Phase.FINAL_RESULTS:
      return "fallback";
    default:
      return assertUnreachable(phase);
  }
};

export const resolveStageViewModel = (roomState: RoomState | null): StageViewModel => {
  const phase = roomState?.phase ?? null;
  const stageMode = resolveStageRenderMode(phase);
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
    currentRoundConfig,
    minigameType,
    minigamePhase,
    activeTeamName,
    shouldRenderTeamTurnContext,
    minigameDisplayView,
    eatingTimerSnapshot,
    fallbackEatingSeconds: roomState?.gameConfig?.timers.eatingSeconds ?? null,
    hasRoomState: roomState !== null
  };
};
