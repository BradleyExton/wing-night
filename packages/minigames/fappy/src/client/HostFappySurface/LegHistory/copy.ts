export const legHistoryCopy = {
  title: "Legs",
  pending: "—",
  cleared: "✓",
  crashes: (crashes: number): string => `${crashes}×`
} as const;
