// Every word on Brad's team board.
export const adminTeamBoardCopy = {
  eyebrow: (seated: number, total: number): string => `${seated} of ${total} seated`,
  title: "Teams",
  body: "Who picked what. Move anyone, over the cap if you like; close the picks before the last pull.",
  picksOpen: "Picks are open",
  picksClosed: "Picks are closed",
  switching: "One moment…",
  seats: (taken: number, cap: number): string => `${taken} of ${cap}`,
  noMembers: "Nobody yet.",
  unseatedTitle: "Unseated",
  unseatedEmpty: "Everyone has a team.",
  birdLabel: (name: string): string => `${name}'s bird`,
  moveLabel: (name: string): string => `Move ${name}`,
  movePlaceholder: "Move…",
  unseat: "Unseat",
  failed: "That didn't take. Try again."
} as const;
