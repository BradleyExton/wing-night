import type { PortalGenre, TeamFormat } from "@wingnight/shared/guestPortal";

// The genres' names as the portal says them (the vote and Brad's tally alike).
export const genreLabels: Record<PortalGenre, string> = {
  metal: "Metal",
  punk: "Punk",
  rock: "Rock",
  pop: "Pop",
  country: "Country",
  disco: "Disco",
  hiphop: "Hip-hop",
  electronic: "Electronic",
  classical: "Classical"
};

export const teamFormatLabels: Record<TeamFormat, string> = {
  host_assigns: "Brad picks the teams",
  guests_pick: "Everyone picks their own",
  random_draw: "A random draw on the TV"
};

// Every word in the vote form.
export const voteFormCopy = {
  eyebrow: "Your vote",
  title: "What should your team be?",
  body: "Each team plays as a kind of music: its look, its anthem, its birds. Rank the ones you'd play for, favourite first. Stop whenever.",
  rankedLabel: "Your ranking",
  rankedEmpty: "Tap a genre below to rank it.",
  unrankedLabel: "Not ranked",
  moveUp: (genre: string): string => `Move ${genre} up`,
  moveDown: (genre: string): string => `Move ${genre} down`,
  unrank: (genre: string): string => `Take ${genre} off your ranking`,
  rank: (genre: string): string => `Rank ${genre}`,
  wishesLabel: "Who you'd sit with (up to two)",
  wishesPrivate: "Only Brad sees this. Nobody is told who asked for whom.",
  wishesEmpty: "Nobody else is on the list yet.",
  formatLabel: "How should teams be made?",
  save: "Save my vote",
  saving: "Saving…",
  saved: "Saved. Change it any time before the night.",
  incomplete: "Rank at least one genre and pick how teams are made.",
  failed: "That didn't save. Try again in a minute."
} as const;
