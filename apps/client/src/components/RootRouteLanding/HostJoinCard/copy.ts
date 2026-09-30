export const hostJoinCardCopy = {
  kicker: "Host tablet",
  instruction: "Scan with the tablet to open the Host Controller.",
  // The address as it would be typed, for a tablet with no camera handy.
  formatAddress: (url: string): string => url.replace(/^https?:\/\//, "")
} as const;
