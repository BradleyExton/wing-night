import { commonCopy } from "../../../../copy/common";

export const setupStageCopy = {
  brandLabel: commonCopy.brandLabel,
  eyebrow: "Tonight",
  fallbackPackName: "Pack loading…",
  packNameValue: (name: string): string => name,
  formatRoundNumber: (round: number): string =>
    String(round).padStart(2, "0"),
  formatRoundLabel: (label: string): string => label,
  formatSauce: (sauce: string): string => sauce,
  formatMinigame: (minigame: string): string => minigame,
  minigameArrow: "→",
  placeholderRoundLabel: "Open Slot",
  placeholderRoundDash: "—",
  placeholderRoundNumber: (round: number): string =>
    `Round ${String(round).padStart(2, "0")}`,
  placeholderRoundSummary: "Choose sauce and mini-game to lock this round.",
  additionalRoundsLabel: (hiddenRoundCount: number): string =>
    `+${hiddenRoundCount} more ${hiddenRoundCount === 1 ? "round" : "rounds"}`,
  waitingForTeamsLabel: "Waiting for teams"
} as const;
