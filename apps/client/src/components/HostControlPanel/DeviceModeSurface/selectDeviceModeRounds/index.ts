import {
  Phase,
  isContestantMinigameType,
  resolveRoundDeviceMode,
  type ContestantMinigameType,
  type MinigameDeviceMode,
  type RoomState
} from "@wingnight/shared";

export type DeviceModeRound = {
  round: number;
  minigame: ContestantMinigameType;
  deviceMode: MinigameDeviceMode;
};

type DeviceModeRoom = Pick<
  RoomState,
  "phase" | "currentRound" | "gameConfig" | "roundDeviceModes"
>;

// The phases inside one team's turn. The turn locked its mode at the briefing, so the deck offers
// the round in hand — for the teams still to come.
const TURN_PHASES: readonly Phase[] = [
  Phase.MINIGAME_INTRO,
  Phase.EATING,
  Phase.TURN_RESULTS
];

// The arcade rounds whose device mode the host can still usefully set from where the night is:
// every arcade round of the night before it starts, the round in hand during a turn (its next
// teams), and the rounds still to come between rounds. A turn locks the mode when its briefing
// opens, so a round's first team plays on whatever was set before that briefing.
export const selectDeviceModeRounds = (room: DeviceModeRoom | null): DeviceModeRound[] => {
  if (room === null) {
    return [];
  }

  const rounds = room.gameConfig?.rounds ?? [];
  const isBeforeNight = room.phase === Phase.SETUP || room.phase === Phase.INTRO;
  const isInTurn = room.phase !== null && TURN_PHASES.includes(room.phase);
  const isBetweenRounds = room.phase === Phase.ROUND_RESULTS;

  return rounds.flatMap((config) => {
    const isOffered =
      isBeforeNight ||
      (isInTurn && config.round === room.currentRound) ||
      (isBetweenRounds && config.round > room.currentRound);

    if (!isOffered || !isContestantMinigameType(config.minigame)) {
      return [];
    }

    return [
      {
        round: config.round,
        minigame: config.minigame,
        deviceMode: resolveRoundDeviceMode(room.roundDeviceModes, config.round)
      }
    ];
  });
};
