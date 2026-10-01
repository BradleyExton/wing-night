export const streetCopy = {
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "Streets of Barrie" : `Streets of Barrie — ${playerName}'s block`,
  walkLeft: "◀",
  walkRight: "▶",
  peck: "PECK",
  handoffCalloutLead: "Hand it to",
  handoffCalloutName: (nextName: string | null): string => nextName ?? "the next player"
} as const;
