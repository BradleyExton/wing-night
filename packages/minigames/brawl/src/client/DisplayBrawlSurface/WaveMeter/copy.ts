export const waveMeterCopy = {
  waveLabel: (waveNumber: number, wavesTotal: number): string => `Wave ${waveNumber} of ${wavesTotal}`,
  // Which edge the pips beside it step in from.
  sideLeft: "◀",
  sideRight: "▶",
  go: "GO ▶"
} as const;
