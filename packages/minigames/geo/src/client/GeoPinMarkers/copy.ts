export const geoPinMarkersCopy = {
  // The tablet's pin has no player behind it: it is the team's shared one.
  label: (name: string | null, isBest: boolean): string => `${isBest ? "★ " : ""}${name ?? "Tablet"}`
} as const;
