export const padBrawlSurfaceCopy = {
  stepOut: "STEP OUT",
  stepOutHint: "Tap and your hen walks onto the street",
  out: "You're sitting this one out. Step out before the next block.",
  waiting: "You're out. Watch the TV — the host starts it.",
  nextBlock: "Next block: your thumbs start it.",
  down: "DOWN",
  downHint: "Shout for a teammate to stand over you",
  away: "Touch to get back up",
  playerTag: (slot: number): string => `P${slot + 1}`,
  hearts: (hearts: number): string => "♥".repeat(Math.max(0, hearts))
} as const;
