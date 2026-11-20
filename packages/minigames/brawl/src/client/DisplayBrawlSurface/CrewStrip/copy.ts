export const crewStripCopy = {
  name: (playerName: string | null, slot: number): string => playerName ?? `P${slot + 1}`,
  down: "Down!",
  away: "zzz",
  heart: "♥",
  star: "★",
  heartsLabel: (hearts: number): string => `${hearts} ${hearts === 1 ? "heart" : "hearts"}`
} as const;
