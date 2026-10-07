import type { SpectatorBetOutcome, SpectatorBetPick } from "@wingnight/shared";
import { formatSpectatorBetLine as formatLine } from "../../../copy/formatters";

const sideName = (pick: SpectatorBetPick): string => (pick === "over" ? "Over" : "Under");

// The watchers' side bet on a phone (mockups/spectator-bets, frames 1–4).
export const spectatorBetCardCopy = {
  formatLine,
  eyebrow: (teamName: string | null): string => (teamName === null ? "Side bet" : `Side bet · ${teamName}`),
  lineUnit: "points",
  overLabel: "Over",
  underLabel: "Under",
  overGlyph: "▲",
  underGlyph: "▼",
  openVoice: (pick: SpectatorBetPick | null): string =>
    pick === null
      ? "Over or under? Change your mind till the game starts."
      : `You've got them ${pick}. Change your mind till the game starts.`,
  fine: "Just for bragging rights. It never touches the team scores.",
  lockedTitle: (pick: SpectatorBetPick | null): string => (pick === null ? "Bets closed" : "Bet locked"),
  lockedVoice: (pick: SpectatorBetPick | null, line: number): string =>
    pick === null ? "No bet from you this turn." : `${sideName(pick)} ${formatLine(line)}.`,
  watchTheTv: "Watch the TV.",
  stamp: (pick: SpectatorBetPick, outcome: SpectatorBetOutcome): string => {
    if (outcome === "push") {
      return "Push · bet's off";
    }

    return pick === outcome ? "✓ Called it" : "✗ Not this time";
  },
  settledTitle: (outcome: SpectatorBetOutcome): string => (outcome === "push" ? "Dead on" : sideName(outcome)),
  settledVoice: (turnPoints: number, line: number): string =>
    `They scored ${turnPoints} on a ${formatLine(line)} line.`
} as const;
