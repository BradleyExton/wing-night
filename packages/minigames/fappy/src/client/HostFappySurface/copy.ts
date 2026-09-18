import type { FappyLegOutcome } from "@wingnight/shared";

const OUTCOME_TITLES: Record<FappyLegOutcome, string> = {
  cleared: "Section cleared!",
  crashed: "Down in the sand.",
  skipped: "Leg skipped."
};

export const hostFappySurfaceCopy = {
  railTitle: "Fappy Bird",
  teamPrefix: "In the air:",
  noAssignedTeamLabel: "No team assigned",
  pendingChip: (points: number): string => `+${points} pending`,
  introDescription:
    "Your team's chickens fly a relay through a corridor of champs. Each player takes one leg on the tablet: tap anywhere to flap, clear your section or crash, then pass it on. Every gate cleared is a point.",
  legCounter: (legNumber: number, legsTotal: number): string => `Leg ${legNumber} of ${legsTotal}`,
  flyingLabel: (playerName: string | null): string =>
    playerName === null ? "Flying: the house hen" : `Flying: ${playerName}`,
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "The corridor" : `The corridor — ${playerName}'s bird`,
  readyHint: "Tap anywhere on the corridor to launch, then keep tapping to stay up.",
  readyLockedHint: "Waiting for the host to open the round.",
  flyingHint: "Keep tapping — the TV is watching.",
  settlingHint: "Settling the leg from the log…",
  outcomeTitle: (outcome: FappyLegOutcome): string => OUTCOME_TITLES[outcome],
  outcomeGates: (gates: number): string => `+${gates} gate${gates === 1 ? "" : "s"}`,
  passButtonLabel: (nextPlayerName: string | null): string =>
    nextPlayerName === null ? "Pass the tablet →" : `Pass the tablet → ${nextPlayerName}`,
  finishButtonLabel: "Finish the relay",
  turnOverLabel: "Relay over — advance the phase when the room is ready.",
  doneHint: "Every leg is flown. Nothing left to tap.",
  skipLegButtonLabel: "Skip leg",
  redoLegButtonLabel: "Redo leg",
  resetTurnButtonLabel: "Reset turn",
  historyTitle: "Legs",
  historyPending: "—",
  historyGates: (gates: number): string => `${gates}`,
  totalsTitle: "Round so far",
  totalsPoints: (points: number): string => `${points} pt${points === 1 ? "" : "s"}`,
  gatesTotal: (gates: number): string => `${gates} gate${gates === 1 ? "" : "s"} cleared`
} as const;
