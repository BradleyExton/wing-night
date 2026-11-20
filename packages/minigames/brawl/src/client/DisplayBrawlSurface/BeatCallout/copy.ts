import type { BrawlCrewOutcome } from "@wingnight/shared";

import type { BrawlSetting } from "../../CrewScene/Backdrop/index.js";

export const beatCalloutCopy = {
  setting: {
    dunlop: "Dunlop Street",
    waterfront: "The waterfront",
    beach: "Centennial Beach"
  } satisfies Record<BrawlSetting, string>,
  // The same three, as they read in the middle of a sentence.
  settingNext: {
    dunlop: "Dunlop Street",
    waterfront: "the waterfront",
    beach: "Centennial Beach"
  } satisfies Record<BrawlSetting, string>,
  lead: {
    cleared: (setting: string): string => setting,
    wipe: (): string => "Everybody down",
    timeout: (setting: string): string => setting
  } satisfies Record<BrawlCrewOutcome, (setting: string) => string>,
  line: {
    cleared: "Block clear!",
    wipe: "Into the bay!",
    timeout: "Time!"
  } satisfies Record<BrawlCrewOutcome, string>,
  lastLead: "Last block",
  lastLine: "Street clear!",
  next: (setting: string, onTablet: boolean): string =>
    onTablet ? `Next: ${setting} — start it on the tablet` : `Next: ${setting} — first thumb starts it`
} as const;
