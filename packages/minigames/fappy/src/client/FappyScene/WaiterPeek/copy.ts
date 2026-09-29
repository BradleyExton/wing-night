export const waiterPeekCopy = {
  name: (playerName: string | null): string => playerName ?? "The next bird",
  line: "waiting on the roof"
} as const;
