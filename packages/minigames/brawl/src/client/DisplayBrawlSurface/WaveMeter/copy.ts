export const waveMeterCopy = {
  waveLabel: (waveNumber: number, wavesTotal: number): string => `Wave ${waveNumber} of ${wavesTotal}`,
  // Which edge the pips beside it step in from.
  sideLeft: "◀",
  sideRight: "▶",
  // The clean-wave star: lit while she is untouched, gold when the wave banks.
  star: "★",
  go: "GO ▶"
} as const;
