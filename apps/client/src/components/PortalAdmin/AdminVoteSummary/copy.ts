// Every word in Brad's vote summary. The genre and format names are the vote form's own.
export { genreLabels, teamFormatLabels } from "../../PortalProfile/VoteForm/copy";

export const adminVoteSummaryCopy = {
  eyebrow: (voters: number): string => (voters === 1 ? "1 vote in" : `${voters} votes in`),
  title: "Votes",
  genresLabel: "Genres, by points",
  genresNote: (genres: number): string => `A first choice is worth ${genres}, a second ${genres - 1}, and so on.`,
  firstChoices: (count: number): string => (count === 1 ? "1 first" : `${count} firsts`),
  formatsLabel: "How teams get made",
  wishesLabel: "Asked for each other",
  wishesEmpty: "No pair has asked for each other yet.",
  pair: (first: string, second: string): string => `${first} & ${second}`,
  notVotedLabel: "Still to vote",
  everyoneVoted: "Everyone has voted.",
  noVotes: "No votes yet."
} as const;
