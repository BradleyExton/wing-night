export const crewPhoneBrawlSurfaceCopy = {
  sceneLabel: "Streets of Barrie, played online",
  watching: "Watching: you'll be in the next game.",
  nextBlock: "Next block: touch either side to start it.",
  down: "DOWN",
  downHint: "Shout for a teammate to stand over you",
  away: "Touch to get back up",
  playerTag: (slot: number): string => `P${slot + 1}`,
  hearts: (hearts: number): string => "♥".repeat(Math.max(0, hearts))
} as const;
