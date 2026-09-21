export const corridorCopy = {
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "The corridor" : `The corridor — ${playerName}'s bird`,
  handoffCalloutLead: "Hand it to",
  handoffCalloutName: (nextName: string | null): string => nextName ?? "the next player"
} as const;
