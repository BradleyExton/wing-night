export const waiterPeekCopy = {
  name: (playerName: string | null): string => playerName ?? "The next bird",
  line: "waiting at the cliff"
} as const;
