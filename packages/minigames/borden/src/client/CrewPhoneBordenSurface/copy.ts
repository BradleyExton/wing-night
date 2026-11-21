import type { BordenBottle } from "@wingnight/shared";

export const crewPhoneBordenSurfaceCopy = {
  sceneLabel: "Base Borden, played online",
  watching: "Watching: you'll be in the next game.",
  nextUp: (stretchNumber: number): string => `Your pair runs stretch ${stretchNumber}. Watch this one.`,
  sittingOut: "You've run your stretches. Cheer them home.",
  nextStretch: "Next stretch: touch either side to start it.",
  down: "DOWN",
  downHint: "Shout for your partner to stand over you",
  away: "Touch to get back up",
  hearts: (hearts: number): string => "♥".repeat(Math.max(0, hearts)),
  bottles: {
    mild: "mild",
    spread: "SPREAD",
    long: "LONG",
    puddle: "PUDDLE"
  } satisfies Record<BordenBottle, string>
} as const;
