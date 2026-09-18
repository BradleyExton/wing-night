import type { FappyLegOutcome } from "@wingnight/shared";

const OUTCOME_COPY: Record<FappyLegOutcome, { title: string; blurb: string }> = {
  cleared: { title: "Section cleared", blurb: "Through the whole corridor, not a feather lost." },
  crashed: { title: "Crash landing", blurb: "Down in the sand. The champ does not care." },
  skipped: { title: "Leg skipped", blurb: "The tablet moves on." }
};

export const displayFappySurfaceCopy = {
  title: "Fappy Bird",
  introTitle: "Fappy Bird",
  introDescription:
    "Your team's chickens fly a relay through a corridor of champs. One player per leg: tap to flap, crash to pass the tablet. Every gate cleared is a point.",
  waitingLabel: "Waiting for the relay to start…",
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "The corridor" : `The corridor — ${playerName}'s bird`,
  legCounter: (legNumber: number, legsTotal: number): string => `Leg ${legNumber} of ${legsTotal}`,
  gatesCounter: (gatesCleared: number, gatesTotal: number): string =>
    `${gatesCleared} / ${gatesTotal} gates`,
  pendingPoints: (points: number): string => `+${points}`,
  readyPrompt: (playerName: string | null): string =>
    playerName === null ? "Tap to launch" : `${playerName} is up — tap to launch`,
  flyingPrompt: (playerName: string | null): string =>
    playerName === null ? "In the air" : `${playerName} is flying`,
  outcomeTitle: (outcome: FappyLegOutcome): string => OUTCOME_COPY[outcome].title,
  outcomeBlurb: (outcome: FappyLegOutcome): string => OUTCOME_COPY[outcome].blurb,
  outcomeGates: (gates: number): string => `+${gates}`,
  donePrompt: "Relay over — next team when the room is ready."
} as const;
