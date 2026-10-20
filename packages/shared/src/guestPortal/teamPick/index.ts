// A guest's team on wingnight.tv before the party: which of the night's teams they picked, and
// what their bird wears on each genre's rail (docs/research/bird-wardrobe.md). The teams themselves
// are the pack's (`teaser-roster.json`, read by the Worker through its ASSETS binding): a pick names
// one by its exact roster name, and a name the roster no longer has is an orphaned pick — shown on
// /me as "pick again" and on /admin as unseated.
import { isRecord } from "../../guards/index.js";
import { isOutfit, type Outfit, type OutfitsByGenre } from "../../outfit/index.js";
import { GENRE_KEYS, type GenreKey, type TeamColorToken } from "../../teamTheme/index.js";
import type { Team } from "../../team/index.js";

// The outfits are kept per genre, in the pick's row, so a bird dressed for metal keeps that outfit
// while the guest tries disco, and gets it back on switching home (research §2.4). A genre the
// guest dressed and then stripped bare is kept too, as an empty outfit: that is how "cleared"
// reaches the pack, where a genre missing from the map means "never dressed" and leaves Brad's
// hand-dressing alone (tools/pull-guests).
export type TeamPick = {
  teamName: string;
  outfitsByGenre: OutfitsByGenre;
};

const isGenreKey = (value: string): value is GenreKey => (GENRE_KEYS as readonly string[]).includes(value);

// Shape only (genre -> slot -> { item, style? }): whether an item is on the rail is the strict
// reader's to say at the write, and the tolerant one's everywhere after.
const isOutfitsByGenre = (value: unknown): value is OutfitsByGenre =>
  isRecord(value) && Object.entries(value).every(([genre, outfit]) => isGenreKey(genre) && isOutfit(outfit));

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

// PUT myOutfit's body: the whole outfit for one genre, which replaces that genre's and leaves
// every other genre's alone. `{}` strips the bird bare there. The genre is the one the page was
// dressing — the Worker refuses it unless it is the guest's team's — and the outfit is read
// strictly by the Worker (parseOutfit), not here.
export type OutfitRequest = {
  genre: GenreKey;
  outfit: Outfit;
};

export const isOutfitRequest = (value: unknown): value is OutfitRequest =>
  isRecord(value) && typeof value.genre === "string" && isGenreKey(value.genre) && isRecord(value.outfit);

// PUT myOutfit's answer: the pick as stored now, every genre's outfit in it.
export type PortalOutfitSaved = {
  team: TeamPick;
};

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
  // What they wear on this team: their outfit for its genre, read tolerantly, so the wardrobe's
  // team strip shows them as the parade will. Absent while they are bare there, and on the
  // unseated, who have no team to dress for.
  outfit?: Outfit;
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
