import { commonCopy } from "../../copy/common";

export const playerPhoneCopy = {
  brandLabel: commonCopy.brandLabel,
  formatJoinedCount: (claimed: number, total: number): string => `${claimed} of ${total} in`,
  findingTheParty: "Finding the party…"
} as const;
