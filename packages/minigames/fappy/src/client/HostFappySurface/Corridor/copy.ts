export const corridorCopy = {
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "The corridor" : `The corridor — ${playerName}'s bird`,
  handoffCalloutLead: "Hand it to",
  handoffCalloutName: (nextName: string | null): string => nextName ?? "the next player",
  // The second line of the callout: who is up after the player it just named.
  handoffCalloutThen: (onDeckName: string): string => `then ${onDeckName}`
} as const;
