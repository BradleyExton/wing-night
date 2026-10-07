import type { SpectatorBetOutcome } from "@wingnight/shared";
import { formatSpectatorBetLine as formatLine } from "../../../../copy/formatters";

export const spectatorBetSettlementCopy = {
  lineLabel: "Line",
  scoredLabel: "Scored",
  wentLabel: "It went",
  formatLine,
  outcome: (outcome: SpectatorBetOutcome): string => (outcome === "push" ? "Dead on" : outcome),
  calledItLabel: "Called it:",
  callers: (names: string[]): string => names.join(", "),
  nobody: "Nobody called it.",
  push: "Dead on the line. Bets are off."
} as const;
