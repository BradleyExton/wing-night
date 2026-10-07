import { formatSpectatorBetLine as formatLine } from "../../../../copy/formatters";

export const spectatorBetReadoutCopy = {
  label: "Over / under",
  formatLine,
  separator: "·",
  betCount: (count: number): string =>
    count === 0 ? "phones, place your bets" : `${count} bet${count === 1 ? "" : "s"} in`
} as const;
