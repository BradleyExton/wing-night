import type { ContraptionRunOutcome } from "@wingnight/shared";

export const displayContraptionSurfaceCopy = {
  introTitle: "Contraption",
  introDescription:
    "The team builds a machine on the tablet. Then everybody watches a wing fall through it.",
  waitingLabel: "Waiting for the host…",
  attemptCounter: (attemptNumber: number, attemptsPerTurn: number): string =>
    `Attempt ${attemptNumber} of ${attemptsPerTurn}`,
  piecesCounter: (placed: number, budget: number): string => `${placed} / ${budget} pieces`,
  buildingPrompt: "Building…",
  buildingHint: "The plan goes up here as they lay it. Heckle responsibly.",
  outcomeLabel: {
    landed: "IN THE BUCKET!",
    short: "Fell short",
    long: "Went long",
    perched: "Hung up",
    restless: "Still going…"
  } satisfies Record<ContraptionRunOutcome, string>,
  runPoints: (points: number): string => `+${points}`,
  bonusesClipped: (count: number): string =>
    count === 0 ? "" : `${count} bonus${count === 1 ? "" : "es"} clipped`,
  donePrompt: "That's the turn",
  doneHint: (bestPoints: number): string =>
    `Best run: ${bestPoints} point${bestPoints === 1 ? "" : "s"}`
} as const;
