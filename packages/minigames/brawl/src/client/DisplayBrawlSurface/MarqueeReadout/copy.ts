import { formatGoonsTally } from "../../goonsTally/index.js";

export const marqueeReadoutCopy = {
  blockCounter: (blockNumber: number, blocksTotal: number): string => `Block ${blockNumber} of ${blocksTotal}`,
  blockNameSeparator: " · ",
  // One glyph per heart; the mirror's paint loop lights and dims them.
  heart: "♥",
  heartsLabel: "Hearts",
  goonsTally: formatGoonsTally,
  goonsLabel: "Down",
  bestGoons: (goons: number): string => `${goons}`,
  bestLabel: (teamName: string | null): string => (teamName === null ? "To beat" : `To beat · ${teamName}`)
} as const;
