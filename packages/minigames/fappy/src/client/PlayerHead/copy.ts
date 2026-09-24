export const playerHeadCopy = {
  // A generated likeness IS the player, so the alt text is their name. A drawn
  // hen is decoration and says so instead.
  headAlt: (playerName: string): string => playerName,
  houseHenLabel: "The house hen"
} as const;
