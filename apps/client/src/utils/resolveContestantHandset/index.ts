import type { MinigameHandset } from "@wingnight/minigames-core";
import {
  CONTESTANT_CONTROLLERS,
  MINIGAME_DEVICE_MODES,
  type ContestantTurn
} from "@wingnight/shared";

// Who plays the leg in hand, as the copy on every screen should say it: what the server says holds
// the leg, never just the turn's mode. A phones turn whose next player has no phone plays that leg
// on the tablet. A phone that dropped mid-leg still has it (nobody else may write its log) until
// the host takes it back.
export const resolveLegHandset = (turn: ContestantTurn | null): MinigameHandset => {
  if (turn === null) {
    return CONTESTANT_CONTROLLERS.TABLET;
  }

  return turn.controller === CONTESTANT_CONTROLLERS.PHONE || turn.droppedPlayerId !== null
    ? CONTESTANT_CONTROLLERS.PHONE
    : CONTESTANT_CONTROLLERS.TABLET;
};

// What the team picks up when the briefing ends, before any leg is in hand: phones only when the
// turn is on phones AND someone on the team has a phone seated. A phones turn nobody joined from
// is a tablet turn in all but name, and the TV must not send the team hunting for phones.
export const resolveBriefingHandset = (
  turn: ContestantTurn | null,
  teamPlayerIds: readonly string[],
  claimedPlayerIds: readonly string[]
): MinigameHandset => {
  const hasSeatedPhone = teamPlayerIds.some((playerId) => claimedPlayerIds.includes(playerId));

  return turn !== null && turn.deviceMode === MINIGAME_DEVICE_MODES.PHONES && hasSeatedPhone
    ? CONTESTANT_CONTROLLERS.PHONE
    : CONTESTANT_CONTROLLERS.TABLET;
};
