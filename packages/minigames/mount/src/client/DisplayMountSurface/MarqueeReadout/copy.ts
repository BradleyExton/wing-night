import { formatHens } from "../../lineHeight/index.js";

export const marqueeReadoutCopy = {
  climbCounter: (climbNumber: number, climbsTotal: number): string => `Climb ${climbNumber} of ${climbsTotal}`,
  climbNameSeparator: " · ",
  clockLabel: "Clock",
  lineHolder: (holderName: string): string => holderName,
  lineHeight: (height: number): string => `${formatHens(height)} hens`,
  lineLabel: "Line",
  points: (points: number): string => `+${points}`,
  pointsLabel: "Points"
} as const;
