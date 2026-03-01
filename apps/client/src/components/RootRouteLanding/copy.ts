export const rootRouteLandingCopy = {
  eyebrow: "Wing Night",
  title: "Choose Your Screen",
  description:
    "Open Host Controls on the tablet and Display Board on the TV or projector.",
  actions: [
    {
      href: "/host",
      label: "Open Host Controls",
      detail: "Use this on the host device to run teams, phases, and overrides.",
      tone: "PRIMARY"
    },
    {
      href: "/display",
      label: "Open Display Board",
      detail: "Use this on the room display so everyone can follow the game.",
      tone: "SECONDARY"
    }
  ]
} as const;
