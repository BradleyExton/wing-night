import type { OutfitSlot, OutfitStyle } from "@wingnight/shared";

import type { PortalFailure } from "../../utils/portalApi";

// Every word on /me/wardrobe outside its three parts' own.
export const portalWardrobeCopy = {
  eyebrow: "Your bird",
  title: "Dress for the parade",
  backLink: "Your seat",
  loadingTitle: "One moment.",
  failedTitle: "Something went sideways.",
  failedBody: "We couldn't load your wardrobe. Refresh to try again.",
  noTeamTitle: "No team, no wardrobe.",
  noTeamBody: "Pick a team to open its wardrobe.",
  noTeamLink: "Pick a team",
  railLabel: "The rail",
  dressMe: "🎲 Dress me",
  dressMeLabel: "Dress me at random",
  slotOff: (slot: string): string => `${slot} off.`,
  item: (name: string): string => `${name}.`,
  look: (name: string): string => `${name}.`,
  failures: {
    no_team: "You've switched teams since this page opened. Go back to your seat to dress for the new one.",
    network: "No connection. That one didn't save.",
    outfit_invalid: "That one isn't on this rail any more. Refresh the page."
  } as Partial<Record<PortalFailure, string>>,
  failed: "That didn't save. Try again."
} as const;

export const OUTFIT_SLOT_NAMES: Record<OutfitSlot, string> = {
  top: "Top",
  sleeve: "Sleeve",
  tail: "Tail",
  boots: "Boots",
  prop: "Prop",
  stage: "Stage",
  move: "Move"
};

export const OUTFIT_STYLE_NAMES: Record<OutfitStyle, string> = {
  ink: "Ink",
  white: "White",
  team: "Team colour",
  gold: "Gold"
};
