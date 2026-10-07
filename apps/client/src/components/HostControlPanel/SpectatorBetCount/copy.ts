import { formatSpectatorBetLine as formatLine } from "../../../copy/formatters";

export const spectatorBetCountCopy = {
  label: "Side bets",
  line: (line: number): string => `O/U ${formatLine(line)}`,
  count: (count: number): string => `${count} in`,
  separator: "·"
} as const;
