export const relayLineupCopy = {
  title: "Legs",
  cleared: "✓",
  next: "Next",
  crashes: (crashes: number): string => `${crashes}×`,
  // Said for a screen reader and on hover; the chip itself is a face.
  houseHen: "The house hen",
  chipLabel: (playerName: string, legNumber: number): string => `Leg ${legNumber}: ${playerName}`
} as const;
