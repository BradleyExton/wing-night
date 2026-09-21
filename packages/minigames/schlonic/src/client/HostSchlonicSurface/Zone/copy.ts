export const zoneCopy = {
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "Kempenfelt Bay Zone" : `Kempenfelt Bay Zone — ${playerName}'s run`,
  jumpPadLabel: "Jump",
  jumpPadHint: "Hold for height",
  handoffCalloutLead: "Hand it to",
  handoffCalloutName: (nextName: string | null): string => nextName ?? "the next player"
} as const;
