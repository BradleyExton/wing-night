import { commonCopy } from "../../copy/common";

export const rootRouteLandingCopy = {
  brandLabel: commonCopy.brandLabel,
  brandMarkPath: commonCopy.brandMarkPath,
  brandMarkAlt: commonCopy.brandMarkAlt,
  eyebrow: "Party Control",
  title: "Pick Your Screen",
  description:
    "Launch Host Controller on the tablet and Display Board on the TV or projector.",
  selectionLabel: "Choose where this device should go:",
  heroIllustrationPath: "/display/setup/hero.png",
  heroIllustrationAlt: "Wing Night hero illustration",
  actions: [
    {
      href: "/host",
      label: "Host Controller",
      detail: "Run teams, phase flow, timer controls, and score overrides from this screen.",
      targetDevice: "Best on tablet or laptop near the host.",
      tone: "PRIMARY"
    },
    {
      href: "/display",
      label: "Display Board",
      detail: "Show live game context and standings for everyone in the room.",
      targetDevice: "Best on the TV or projector display.",
      tone: "SECONDARY"
    }
  ] as const
} as const;
