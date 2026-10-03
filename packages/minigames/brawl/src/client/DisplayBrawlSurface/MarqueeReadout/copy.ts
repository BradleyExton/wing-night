import { formatGoonsTally } from "../../goonsTally/index.js";

export const marqueeReadoutCopy = {
  blockCounter: (blockNumber: number, blocksTotal: number): string => `Block ${blockNumber} of ${blocksTotal}`,
  blockNameSeparator: " · ",
  heartsLabel: "Hearts",
  goonsTally: formatGoonsTally,
  // Worth, not a count: goons down, clean waves and the hearts carried off a cleared block.
  goonsLabel: "Worth",
  bestGoons: (goons: number): string => `${goons}`,
  bestLabel: (teamName: string | null): string => (teamName === null ? "To beat" : `To beat · ${teamName}`)
} as const;
