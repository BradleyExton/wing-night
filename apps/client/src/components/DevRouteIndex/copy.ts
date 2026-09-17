import { commonCopy } from "../../copy/common";

export const devRouteIndexCopy = {
  brandLabel: commonCopy.brandLabel,
  brandMarkPath: commonCopy.brandMarkPath,
  brandMarkAlt: commonCopy.brandMarkAlt,
  eyebrow: "Dev Tools",
  title: "Minigame Testing",
  description:
    "Every minigame sandbox boots the real runtime plugin against its dev fixture — no server, no room, no sockets.",
  minigameSectionLabel: "Minigame sandboxes:",
  minigameNavLabel: "Minigame sandbox routes",
  labSectionLabel: "Feel labs:",
  labNavLabel: "Dev lab routes",
  homeLinkLabel: "Back to screen picker",
  // Labs have no registry to derive from, so they are listed by hand. The names
  // are pinned against resolveDevLabName in the colocated test, which fails when
  // a lab is renamed or deleted out from under this list.
  labs: [
    {
      href: "/dev/lab/anamorph",
      label: "ANAMORPH Feel Lab",
      detail: "Throwaway rig for settling the ANAMORPH input feel. Deleted when the minigame ships."
    },
    {
      href: "/dev/lab/contraption",
      label: "CONTRAPTION Feel Lab",
      detail: "Throwaway rig for the CONTRAPTION physics feel. Deleted when the minigame ships."
    },
    {
      href: "/dev/lab/contraption-ui",
      label: "CONTRAPTION UI Direction Lab",
      detail: "Side-by-side UI direction variants for CONTRAPTION. Deleted when a direction is picked."
    }
  ] as const
} as const;
