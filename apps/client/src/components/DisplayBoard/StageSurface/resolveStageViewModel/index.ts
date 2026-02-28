import { Phase, type MinigameType, type RoomState } from "@wingnight/shared";
import { type MinigameIntroMetadata } from "@wingnight/minigames-core";

import { resolveMinigameMetadata } from "../../../../minigames/registry";

export type StageRenderMode =
  | "setup"
  | "round_intro"
  | "eating"
  | "minigame_intro"
  | "minigame_play"
  | "fallback";

export type StageViewModel = {
  phase: Phase | null;
  stageMode: StageRenderMode;
  gameConfig: RoomState["gameConfig"];
  currentRoundConfig: RoomState["currentRoundConfig"];
  minigameType: MinigameType | null;
  minigameIntroMetadata: MinigameIntroMetadata | null;
  teamCount: number;
  playerCount: number;
  canAdvancePhase: boolean | null;
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
    case Phase.SETUP:
      return "setup";
    case Phase.ROUND_INTRO:
      return "round_intro";
    case Phase.EATING:
      return "eating";
    case Phase.MINIGAME_INTRO:
      return "minigame_intro";
    case Phase.MINIGAME_PLAY:
      return "minigame_play";
    case null:
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
  const gameConfig = roomState?.gameConfig ?? null;
  const currentRoundConfig = roomState?.currentRoundConfig ?? null;
  const minigameType =
    roomState?.minigameDisplayView?.minigame ?? currentRoundConfig?.minigame ?? null;
  const minigameIntroMetadata =
    minigameType === null ? null : (resolveMinigameMetadata(minigameType)?.intro ?? null);

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
    (stageMode === "eating" || stageMode === "minigame_intro" || stageMode === "minigame_play");

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
    minigameIntroMetadata,
    teamCount: roomState?.teams.length ?? 0,
    playerCount: roomState?.players.length ?? 0,
    canAdvancePhase: roomState?.canAdvancePhase ?? null,
    activeTeamName,
    shouldRenderTeamTurnContext,
    minigameDisplayView,
    eatingTimerSnapshot,
    fallbackEatingSeconds: roomState?.gameConfig?.timers.eatingSeconds ?? null,
    hasRoomState: roomState !== null
  };
};
