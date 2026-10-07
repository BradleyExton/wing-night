import { MINIGAME_DEVICE_MODES, type ContestantMinigameType, type MinigameDeviceMode } from "@wingnight/shared";

import { formatMinigameName } from "../../../copy/formatters";

const modeName = (deviceMode: MinigameDeviceMode): string =>
  deviceMode === MINIGAME_DEVICE_MODES.PHONES ? "phones" : "the tablet";

export const deviceModeSurfaceCopy = {
  title: "Played on",
  roundLabel: (round: number, minigame: ContestantMinigameType): string =>
    `R${round} · ${formatMinigameName(minigame)}`,
  optionLabel: (deviceMode: MinigameDeviceMode): string =>
    deviceMode === MINIGAME_DEVICE_MODES.PHONES ? "Phones" : "Tablet",
  optionAriaLabel: (round: number, deviceMode: MinigameDeviceMode): string =>
    `Round ${round} on ${modeName(deviceMode)}`,
  phonesNote: "Phones: each player plays their own leg on their phone. A face with no phone plays on the tablet.",
  // During a turn the briefing has already locked this team's mode; a change lands from the next team.
  lockedNote: (locked: MinigameDeviceMode, next: MinigameDeviceMode): string =>
    locked === next
      ? `This team's turn: on ${modeName(locked)}.`
      : `This team's turn: on ${modeName(locked)}. ${next === MINIGAME_DEVICE_MODES.PHONES ? "Phones" : "The tablet"} from the next team.`
} as const;
