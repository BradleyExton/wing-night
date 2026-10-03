export const arenaCopy = {
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "Mount Your Hens" : `Mount Your Hens — ${playerName}'s climb`,
  handoffCalloutLead: "Hand it to",
  handoffCalloutName: (name: string | null): string => name ?? "the next hen"
} as const;
