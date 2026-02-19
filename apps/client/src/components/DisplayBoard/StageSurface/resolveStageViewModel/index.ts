import { Phase, type DisplayRoomStateSnapshot } from "@wingnight/shared";

export type StageRenderMode = "round_intro" | "eating" | "minigame" | "fallback";

export type StageViewModel = {
  phase: Phase | null;
  stageMode: StageRenderMode;
  currentRoundConfig: DisplayRoomStateSnapshot["currentRoundConfig"];
  isTriviaTurnPhase: boolean;
  activeTeamName: string | null;
  shouldRenderTeamTurnContext: boolean;
  currentTriviaQuestion: string | null;
  shouldRenderTriviaPrompt: boolean;
  eatingTimerSnapshot: NonNullable<DisplayRoomStateSnapshot["timer"]> | null;
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

export const resolveStageViewModel = (
  roomState: DisplayRoomStateSnapshot | null
): StageViewModel => {
  const phase = roomState?.phase ?? null;
  const stageMode = resolveStageRenderMode(phase);
  const currentRoundConfig = roomState?.currentRoundConfig ?? null;
  const isMinigamePlayPhase = phase === Phase.MINIGAME_PLAY;
  const isTriviaTurnPhase =
    isMinigamePlayPhase && currentRoundConfig?.minigame === "TRIVIA";

  const activeRoundTeamId = roomState?.activeRoundTeamId ?? null;
  const activeTurnTeamId =
    roomState?.minigameDisplayView?.activeTurnTeamId ??
    roomState?.activeTurnTeamId ??
    null;

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

  const currentTriviaQuestion =
    roomState?.minigameDisplayView?.minigame === "TRIVIA"
      ? (roomState.minigameDisplayView.currentPrompt?.question ?? null)
      : null;
  const shouldRenderTriviaPrompt =
    isTriviaTurnPhase && currentTriviaQuestion !== null;

  const eatingTimerSnapshot =
    stageMode === "eating" && roomState?.timer?.phase === Phase.EATING
      ? roomState.timer
      : null;

  return {
    phase,
    stageMode,
    currentRoundConfig,
    isTriviaTurnPhase,
    activeTeamName,
    shouldRenderTeamTurnContext,
    currentTriviaQuestion,
    shouldRenderTriviaPrompt,
    eatingTimerSnapshot,
    fallbackEatingSeconds: roomState?.gameConfig?.timers.eatingSeconds ?? null,
    hasRoomState: roomState !== null
  };
};
