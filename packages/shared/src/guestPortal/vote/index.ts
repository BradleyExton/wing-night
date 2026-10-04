// A guest's private vote on wingnight.tv before the party: which music they want their team to
// be, who they would like to sit with, and how the teams should be made at all. Only the host's
// admin summary ever reads it back (the wishes above all — a guest never sees anyone's).
import { isRecord } from "../../guards/index.js";
import { GENRE_KEYS, type GenreKey } from "../../teamTheme/index.js";

// Every team genre but `none`, the stock bird a team gets when nobody picked one: there is nothing
// to vote for in it.
export type PortalGenre = Exclude<GenreKey, "none">;

export const PORTAL_GENRES: readonly PortalGenre[] = GENRE_KEYS.filter(
  (genre): genre is PortalGenre => genre !== "none"
);

export const TEAM_FORMATS = ["host_assigns", "guests_pick", "random_draw"] as const;
export type TeamFormat = (typeof TEAM_FORMATS)[number];

export const TEAMMATE_WISHES_MAX = 2;

// `genreRanking` is a ranked PREFIX: the guest's favourite first, as many as they care to order
// (at least one, at most every genre), each once. Ranking all nine on a phone is a chore nobody
// finishes, and the genres left off simply score nothing (resolveGenreBordaPoints).
export type GuestVote = {
  genreRanking: PortalGenre[];
  teammateWishes: string[];
  teamFormat: TeamFormat;
};

const isPortalGenre = (value: unknown): value is PortalGenre => {
  return typeof value === "string" && (PORTAL_GENRES as readonly string[]).includes(value);
};

const isTeamFormat = (value: unknown): value is TeamFormat => {
  return typeof value === "string" && (TEAM_FORMATS as readonly string[]).includes(value);
};

const hasNoRepeats = (values: readonly string[]): boolean => {
  return new Set(values).size === values.length;
};

const isGenreRanking = (value: unknown): value is PortalGenre[] => {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= PORTAL_GENRES.length &&
    value.every(isPortalGenre) &&
    hasNoRepeats(value)
  );
};

// Shape only: whether each wish names a guest who exists is the portal's to check against its
// guest list. A guest never wishes for themself.
const isTeammateWishes = (value: unknown, selfGuestId: string): value is string[] => {
  return (
    Array.isArray(value) &&
    value.length <= TEAMMATE_WISHES_MAX &&
    value.every((wish) => typeof wish === "string" && wish.length > 0 && wish !== selfGuestId) &&
    hasNoRepeats(value)
  );
};

export const isGuestVote = (value: unknown, selfGuestId: string): value is GuestVote => {
  return (
    isRecord(value) &&
    isGenreRanking(value.genreRanking) &&
    isTeammateWishes(value.teammateWishes, selfGuestId) &&
    isTeamFormat(value.teamFormat)
  );
};

// The genre tally is a Borda count over the ranked prefix: with N genres on the ballot, a first
// choice is worth N, a second N - 1, and so on, and a genre the guest left unranked is worth 0.
// A long ranking therefore says more than a short one without a short one being thrown away.
export const resolveGenreBordaPoints = (genreRanking: readonly PortalGenre[]): Map<PortalGenre, number> => {
  return new Map(genreRanking.map((genre, rankIndex) => [genre, PORTAL_GENRES.length - rankIndex]));
};
