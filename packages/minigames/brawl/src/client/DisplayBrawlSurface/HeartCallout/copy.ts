export const heartCalloutCopy = {
  lead: (heartPrice: number): string => `Four hearts · −${heartPrice} worth`,
  name: (playerName: string | null): string => playerName ?? "The hen",
  line: "bought a heart"
} as const;
