import { isDeepStrictEqual } from "node:util";

import {
  CONTESTANT_CONTROLLERS,
  MINIGAME_DEVICE_MODES,
  Phase,
  isContestantMinigameType,
  resolveRoundDeviceMode,
  type ContestantTurn,
  type MinigameType,
  type RoomState
} from "@wingnight/shared";

import {
  isContestantMinigameAction,
  selectActiveMinigameContestant,
  supportsContestantTurns
} from "../../minigames/runtime/index.js";
import { resolveMinigameRules } from "../selectors/index.js";

// Who plays the leg in hand of an arcade relay, and on which device (`RoomState.contestantTurn`).
//
// Two parts of it are facts the room has to remember: the device mode the turn was LOCKED to
// when its briefing opened, and the legs the tablet holds for the rest of the turn. The rest is
// derived, by `syncContestantTurn`, from the game's own `selectContestant` and the claim flags —
// re-derived after every room mutation that moved anything (`defineRoomMutation`) and after every
// claim-flag write, so no client ever works out who may play.

// The phases one team's turn spans. The turn's lock is taken entering the first and dropped
// leaving the last.
const TURN_PHASES: readonly Phase[] = [
  Phase.MINIGAME_INTRO,
  Phase.EATING,
  Phase.MINIGAME_PLAY,
  Phase.TURN_RESULTS
];

const createLockedTurn = (state: RoomState): ContestantTurn | null => {
  const minigame = state.currentRoundConfig?.minigame ?? null;

  if (minigame === null || !isContestantMinigameType(minigame) || !supportsContestantTurns(minigame)) {
    return null;
  }

  return {
    minigame,
    deviceMode: resolveRoundDeviceMode(state.roundDeviceModes, state.currentRound),
    legIndex: null,
    contestantPlayerId: null,
    nextContestantPlayerId: null,
    controller: CONTESTANT_CONTROLLERS.TABLET,
    tabletLegIndexes: [],
    droppedPlayerId: null
  };
};

// Runs inside every phase transition. A briefing opening locks the round's device mode into the
// turn — a fresh lock for every team, so the host's change lands from the next turn and never
// mid-turn. Leaving the turn's phases lets the lock go.
export const applyContestantTurnPhaseEffects = (state: RoomState, nextPhase: Phase): void => {
  if (nextPhase === Phase.MINIGAME_INTRO) {
    state.contestantTurn = createLockedTurn(state);
  } else if (!TURN_PHASES.includes(nextPhase)) {
    state.contestantTurn = null;
  }

  syncContestantTurn(state);
};

const deriveContestantTurn = (state: RoomState, turn: ContestantTurn): ContestantTurn => {
  const contestant =
    state.phase === Phase.MINIGAME_PLAY
      ? selectActiveMinigameContestant(resolveMinigameRules(state, turn.minigame))
      : null;

  if (contestant === null || contestant.minigameId !== turn.minigame) {
    return {
      ...turn,
      legIndex: null,
      contestantPlayerId: null,
      nextContestantPlayerId: null,
      controller: CONTESTANT_CONTROLLERS.TABLET,
      droppedPlayerId: null
    };
  }

  const { legIndex, playerId, nextPlayerId } = contestant.result;
  // The leg is the phone's to play: phones mode, a contestant with a claimed face, and a leg the
  // tablet has not taken. Whether the phone is awake decides only who writes it right now.
  const isPhoneLeg =
    turn.deviceMode === MINIGAME_DEVICE_MODES.PHONES &&
    playerId !== null &&
    state.claimedPlayerIds.includes(playerId) &&
    !turn.tabletLegIndexes.includes(legIndex);
  const isConnected = playerId !== null && state.connectedPlayerIds.includes(playerId);
  // A phone that was holding this very leg — or had already dropped it — and is not here now.
  // A phone asleep before its leg came up never held it, so it raises no flag: the tablet just
  // plays that leg.
  const didHoldThisLeg =
    turn.legIndex === legIndex &&
    turn.contestantPlayerId === playerId &&
    (turn.controller === CONTESTANT_CONTROLLERS.PHONE || turn.droppedPlayerId === playerId);

  return {
    ...turn,
    legIndex,
    contestantPlayerId: playerId,
    nextContestantPlayerId: nextPlayerId,
    controller:
      isPhoneLeg && isConnected ? CONTESTANT_CONTROLLERS.PHONE : CONTESTANT_CONTROLLERS.TABLET,
    droppedPlayerId: isPhoneLeg && !isConnected && didHoldThisLeg ? playerId : null
  };
};

// Re-derives the leg in hand and its controller; says whether anything moved.
export const syncContestantTurn = (state: RoomState): boolean => {
  const turn = state.contestantTurn;

  if (turn === null) {
    return false;
  }

  const nextTurn = deriveContestantTurn(state, turn);

  if (isDeepStrictEqual(turn, nextTurn)) {
    return false;
  }

  state.contestantTurn = nextTurn;

  return true;
};

// The phone-mode turn, if this action belongs to it: the leg it would be written to. Null in
// tablet mode, for another game, and for an action no phone sends (a skip, a reset).
export const resolveContestantLegForAction = (
  state: RoomState,
  minigameId: MinigameType,
  actionType: string
): number | null => {
  const turn = state.contestantTurn;

  if (
    turn === null ||
    turn.minigame !== minigameId ||
    turn.deviceMode !== MINIGAME_DEVICE_MODES.PHONES ||
    turn.legIndex === null ||
    !isContestantMinigameAction(minigameId, actionType)
  ) {
    return null;
  }

  return turn.legIndex;
};

// One log writer per leg. While the phone holds the leg in hand, the tablet's input for it is
// refused — its hatches (skip, reset, take back, JOUST's next shot) are not inputs and always land.
// A phone that dropped mid-leg still owns the log it began: the tablet gets the leg only through
// the take-back, which restarts it with a fresh log, never by writing into the phone's.
export const isLegHeldByPhone = (
  state: RoomState,
  minigameId: MinigameType,
  actionType: string
): boolean => {
  const turn = state.contestantTurn;

  return (
    resolveContestantLegForAction(state, minigameId, actionType) !== null &&
    (turn?.controller === CONTESTANT_CONTROLLERS.PHONE || turn?.droppedPlayerId !== null)
  );
};

// The turn started over (the game's reset hatch): every leg is fresh, so none is the tablet's any
// more and each goes back to its contestant's phone.
export const releaseContestantTabletLegs = (state: RoomState): boolean => {
  const turn = state.contestantTurn;

  if (turn === null || turn.tabletLegIndexes.length === 0) {
    return false;
  }

  state.contestantTurn = { ...turn, tabletLegIndexes: [] };

  return true;
};

// The tablet wrote to a leg, or the host took it back: the leg is the tablet's for the rest of
// the turn, so a phone that wakes up mid-leg can never start writing a log the tablet began.
export const holdContestantLegOnTablet = (state: RoomState, legIndex: number): boolean => {
  const turn = state.contestantTurn;

  if (turn === null || turn.tabletLegIndexes.includes(legIndex)) {
    return false;
  }

  state.contestantTurn = { ...turn, tabletLegIndexes: [...turn.tabletLegIndexes, legIndex] };

  return true;
};
