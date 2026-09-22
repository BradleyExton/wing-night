import type { MinigameSurfacePhase } from "@wingnight/minigames-core";
import {
  Phase,
  resolveMinigameDefinition,
  type MinigameTimerKey,
  type MinigameType,
  type RoomState,
  type RoomTimerState,
  type Team
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

// The host preview's own `RoomState`, built so the shell's real chrome —
// `TakeoverTimerChip` and `HostMiniRail`, both reading straight off
// `useHostRoomState` like they do on the tablet — sees the same shape it does
// in the room. `null` only on the intro phase, which the sandbox draws as a
// deck panel and which mounts neither.
//
// It carries the turn's team and the selected game because the rail is a slot
// in the takeover now: a preview whose rail says "Pre-game" with no team would
// lie about the layout being judged in it, the same way the preview lied about
// the corner before it composed the clock itself. A host-paced game (six of
// the nine, `timerKey: null`) gets a room with `timer: null`, which is exactly
// what makes the chip render nothing and the clock slot cost no width.
export const resolveSandboxHostRoomState = (
  minigameType: MinigameType,
  phase: MinigameSurfacePhase,
  activeTurnTeamId: string | null,
  teams: readonly Team[]
): RoomState | null => {
  if (phase !== "play") {
    return null;
  }

  return {
    phase: Phase.MINIGAME_PLAY,
    currentRound: 1,
    totalRounds: 1,
    players: [],
    teams: teams.map((team) => ({ ...team, playerIds: [...team.playerIds] })),
    lobbyPlaylist: [],
    gameConfig: null,
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: activeTurnTeamId,
    activeTurnTeamId,
    timer: resolveSandboxTimer(minigameType),
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
