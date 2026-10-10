// A guest's team on wingnight.tv before the party: which of the night's teams they picked, and
// (from milestone 3 of docs/guest-portal-team-pick-plan.md) what their bird wears on each team's
// rail. The teams themselves are the pack's (`teaser-roster.json`, read by the Worker through its
// ASSETS binding): a pick names one by its exact roster name, and a name the roster no longer has
// is an orphaned pick — shown on /me as "pick again" and on /admin as unseated.
import { isRecord } from "../../guards/index.js";
import { GENRE_KEYS, type GenreKey, type TeamColorToken } from "../../teamTheme/index.js";
import type { Team } from "../../team/index.js";

// Milestone 1 carries the outfit row empty: `packages/shared/src/outfit` (milestone 3) brings the
// slot and item vocabulary and replaces this shape-only draft with `Outfit`. Until then it is a
// map of slot -> item id, strings both, kept per genre so a bird dressed for metal keeps that
// outfit while the guest tries disco (plan, decision 6).
export type OutfitDraft = Record<string, string>;

export type TeamPick = {
  teamName: string;
  outfitsByGenre: Partial<Record<GenreKey, OutfitDraft>>;
};

const isGenreKey = (value: string): value is GenreKey => (GENRE_KEYS as readonly string[]).includes(value);

const isOutfitDraft = (value: unknown): value is OutfitDraft =>
  isRecord(value) && Object.values(value).every((item) => typeof item === "string");

const isOutfitsByGenre = (value: unknown): value is TeamPick["outfitsByGenre"] =>
  isRecord(value) && Object.entries(value).every(([genre, outfit]) => isGenreKey(genre) && isOutfitDraft(outfit));

export const isTeamPick = (value: unknown): value is TeamPick => {
  return (
    isRecord(value) &&
    typeof value.teamName === "string" &&
    value.teamName.length > 0 &&
    isOutfitsByGenre(value.outfitsByGenre)
  );
};

// PUT myTeam's body. The name is checked against the roster by the Worker, not here.
export type TeamPickRequest = {
  teamName: string;
};

export const isTeamPickRequest = (value: unknown): value is TeamPickRequest =>
  isRecord(value) && typeof value.teamName === "string" && value.teamName.length > 0;

// POST resolveAdminGuestTeamRoute's body: a team to seat the guest on, or null to unseat them.
export type AdminTeamSeatRequest = {
  teamName: string | null;
};

export const isAdminTeamSeatRequest = (value: unknown): value is AdminTeamSeatRequest =>
  isRecord(value) && (value.teamName === null || (typeof value.teamName === "string" && value.teamName.length > 0));

// PUT adminPicks's body: the switch.
export type AdminPicksRequest = {
  closed: boolean;
};

export const isAdminPicksRequest = (value: unknown): value is AdminPicksRequest =>
  isRecord(value) && typeof value.closed === "boolean";

// Seats per team = ceil(guests ÷ teams), recomputed from the live guest count on every read
// (plan, decision 3). Every guest row counts, Brad's included: he sits on a team too. No teams
// means no seats.
export const resolveTeamSeatCap = (guestCount: number, teamCount: number): number => {
  return teamCount <= 0 ? 0 : Math.ceil(Math.max(guestCount, 0) / teamCount);
};

// One of the night's teams as the portal lists it: the roster's own id and name (the name is
// what a pick stores), its genre and authored colour for theming, and who has picked it.
export type PortalTeamMember = {
  guestId: string;
  displayName: string;
  // The kept head's SHA-256 (PortalAvatarStatus.headHash), for `?v=` on resolveGuestAvatarRoute.
  headHash: string | null;
};

export type PortalTeam = {
  id: string;
  name: string;
  genre?: string;
  color?: TeamColorToken;
  members: PortalTeamMember[];
};

// GET teams. Teams in the roster file's order, which is seating order (resolveTeamThemeById walks
// it for the colour collision pass), the cap every team shares, and the switch.
export type PortalTeamList = {
  teams: PortalTeam[];
  seatCap: number;
  picksClosed: boolean;
};

// PUT myTeam: the pick as stored, and the list as it is now that the guest is on it.
export type PortalTeamPicked = {
  team: TeamPick;
  teams: PortalTeamList;
};

// GET adminTeams, and what the reseat route hands back: the list plus everyone off it — guests
// with no pick, and guests whose pick names a team the roster no longer has.
export type AdminTeamBoard = PortalTeamList & {
  unseated: PortalTeamMember[];
};

// PUT adminPicks's answer.
export type AdminPicksState = {
  picksClosed: boolean;
};

// The `Team` a portal team is themed as. resolveTeamThemeById (the client) takes the party's
// roster shape; a portal team is one with nobody seated by player id and no score yet.
export const resolveThemeTeam = (team: PortalTeam): Team => ({
  id: team.id,
  name: team.name,
  playerIds: [],
  totalScore: 0,
  ...(team.genre === undefined ? {} : { genre: team.genre }),
  ...(team.color === undefined ? {} : { color: team.color })
});
