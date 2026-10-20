// Every word in the bird card.
export const yourBirdCardCopy = {
  eyebrow: "Your bird",
  title: "Dress for the parade",
  noTeam: "Pick a team to open its wardrobe.",
  open: "Open the wardrobe",
  birdLabel: (summary: string): string => `Your bird. ${summary}`
} as const;
