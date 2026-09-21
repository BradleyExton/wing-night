export const shotHistoryCopy = {
  title: "This turn",
  pending: "—",
  points: (points: number): string => `+${points}`
} as const;
