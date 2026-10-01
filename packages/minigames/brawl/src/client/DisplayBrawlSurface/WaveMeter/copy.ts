export const waveMeterCopy = {
  waveLabel: (waveNumber: number, wavesTotal: number): string => `Wave ${waveNumber} of ${wavesTotal}`,
  go: "GO ▶"
} as const;
