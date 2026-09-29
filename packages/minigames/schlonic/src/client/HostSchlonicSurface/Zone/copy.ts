export const zoneCopy = {
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "Dunlop Street Zone" : `Dunlop Street Zone — ${playerName}'s run`,
  handoffCalloutLead: "Hand it to",
  handoffCalloutName: (nextName: string | null): string => nextName ?? "the next player"
} as const;
