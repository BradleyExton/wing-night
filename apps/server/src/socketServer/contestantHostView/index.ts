import {
  CONTESTANT_CONTROLLERS,
  MINIGAME_DEVICE_MODES,
  Phase,
  isContestantMinigameType,
  type ContestantMinigameHostView,
  type MinigameHostView,
  type PlayerMinigameHostViewPayload,
  type RoomState
} from "@wingnight/shared";

const isContestantMinigameHostView = (
  view: MinigameHostView
): view is ContestantMinigameHostView => {
  return isContestantMinigameType(view.minigame);
};

// Who, if anyone, is handed the game's host view right now, and the payload they get. The one
// path a host view takes to a phone, and it is narrow on purpose: play is on, the turn was locked
// to phones, the phone — not the tablet — holds the leg in hand, and the game is one of the four
// arcade relays, whose host views carry nothing the display does not. One player, through their
// own `player:<id>` room. The shared player snapshot never carries it.
export const resolveContestantHostViewDelivery = (
  roomState: Pick<RoomState, "phase" | "contestantTurn" | "minigameHostView">
): { playerId: string; payload: PlayerMinigameHostViewPayload } | null => {
  const turn = roomState.contestantTurn;
  const view = roomState.minigameHostView;

  if (
    roomState.phase !== Phase.MINIGAME_PLAY ||
    turn === null ||
    turn.deviceMode !== MINIGAME_DEVICE_MODES.PHONES ||
    turn.controller !== CONTESTANT_CONTROLLERS.PHONE ||
    turn.contestantPlayerId === null ||
    view === null ||
    !isContestantMinigameHostView(view) ||
    view.minigame !== turn.minigame
  ) {
    return null;
  }

  return { playerId: turn.contestantPlayerId, payload: { minigameHostView: view } };
};
