export const bordenSceneCopy = {
  gate: "GATE",
  finalGate: "MAIN GATE",
  alarm: "!",
  playerTag: (slot: number): string => `P${slot + 1}`
} as const;
