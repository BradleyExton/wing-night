export const contestantPhoneMonitorCopy = {
  // The hatches, worded as each game's own host surface words them.
  hatchLabels: {
    skipLeg: "Skip leg",
    skipRun: "Skip run",
    skipBlock: "Skip block",
    skipShot: "Skip shot",
    nextShot: "Next shot →",
    resetTurn: "Reset turn"
  },
  onPhone: (name: string | null): string => (name === null ? "On a phone" : `On ${name}'s phone`),
  droppedChip: (name: string | null): string => (name === null ? "Phone dropped" : `${name}'s phone dropped`),
  takeBackLabel: "Take it back",
  takeBackHint: "Take it back restarts this leg here, on the tablet.",
  droppedTitle: (name: string | null): string => (name === null ? "The phone dropped" : `${name}'s phone dropped`),
  droppedBody: "The leg waits. Take it back and finish it on the tablet.",
  waitingForView: "Waiting for the game…"
} as const;
