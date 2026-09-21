import type { MinigameSurfacePhase } from "@wingnight/minigames-core";
import {
  Phase,
  resolveMinigameDefinition,
  type MinigameTimerKey,
  type MinigameType,
  type RoomState,
  type RoomTimerState
} from "@wingnight/shared";

// Stand-in durations for the three minigames that declare a play-phase clock
// (GEO, DRAWING, EMOJI_CHARADES) — the sandbox has no gameConfig to read a
// configured duration from, only enough to show the chip truthfully. These
// match the fixture seconds every other sandbox/test room is built with
// (`buildGameConfig`'s defaults), so the number on screen isn't a surprise.
const SANDBOX_TIMER_SECONDS_BY_TIMER_KEY: Record<MinigameTimerKey, number> = {
  geoSeconds: 45,
  drawingSeconds: 60,
  emojiCharadesSeconds: 90
};

// Paused at full duration: the sandbox has no clock actually running the
// countdown, so the preview shows the corner chip without racing wall-clock
// time against a server-rendered export.
const resolveSandboxTimer = (minigameType: MinigameType): RoomTimerState | null => {
  const { timerKey } = resolveMinigameDefinition(minigameType);

  if (timerKey === null) {
    return null;
  }

  const durationMs = SANDBOX_TIMER_SECONDS_BY_TIMER_KEY[timerKey] * 1000;

  return {
    phase: Phase.MINIGAME_PLAY,
    startedAt: 0,
    endsAt: 0,
    durationMs,
    isPaused: true,
    remainingMs: durationMs
  };
};

// The host preview's own `RoomState`, built just so `TakeoverTimerChip` — the
// real component, reading straight off `useHostRoomState` like it does on the
// tablet — sees the same shape it does in the room. `null` here is what makes
// the chip render nothing: a host-paced game (most of them, `timerKey: null`)
// or the intro phase, neither of which the real shell ever mounts the chip
// under either.
export const resolveSandboxHostRoomState = (
  minigameType: MinigameType,
  phase: MinigameSurfacePhase
): RoomState | null => {
  if (phase !== "play") {
    return null;
  }

  const timer = resolveSandboxTimer(minigameType);

  if (timer === null) {
    return null;
  }

  return {
    phase: Phase.MINIGAME_PLAY,
    currentRound: 1,
    totalRounds: 1,
    players: [],
    teams: [],
    lobbyPlaylist: [],
    gameConfig: null,
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    timer,
    gameStartCountdownEndsAt: null,
    musicPlayback: null,
    musicVolume: 1,
    minigameHostView: null,
    minigameDisplayView: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: true
  };
};
