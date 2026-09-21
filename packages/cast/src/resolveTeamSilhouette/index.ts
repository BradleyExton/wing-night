import {
  CHARACTER_SILHOUETTES,
  resolveGenreKey,
  type CharacterDance,
  type CharacterSilhouette,
  type GenreKey,
  type Team
} from "@wingnight/shared";

// What shape a team's birds ARE, as opposed to what they wear. Apparel was the
// first answer to "make a metal team look like a metal team from across the
// room" and it kept losing to arithmetic: one bird is 76px on a 1080p TV, a
// prop is a few pixels of that, and half the props were dropped anyway because
// nothing may cross a player's photographed face. A silhouette has neither
// problem — it is the first thing read and it lives entirely below the chin.
//
// Keyed off the team's free-text `genre` through the one genre vocabulary in
// `@wingnight/shared`, exactly as `resolveTeamApparel` is, so a team's shape
// and the rest of its kit can never disagree about what "funk" is.
export { CHARACTER_SILHOUETTES, type CharacterSilhouette };

const SILHOUETTE_BY_GENRE_KEY: Record<GenreKey, CharacterSilhouette | undefined> = {
  metal: "spiky",
  // Punk and rock sit at the same end of the axis as metal, and share its
  // shapes rather than getting near-identical ones of their own. This is also
  // what retires the studded collar they all used to wear.
  punk: "spiky",
  rock: "spiky",
  // Pop is the ORIGIN of the axis, not a point on it: "smooth, round, upright"
  // is a description of the stock bird, so drawing pop a silhouette produces
  // the bird we already ship. It carries its genre in motion instead — see
  // `resolveTeamDance`.
  pop: undefined,
  country: "broody",
  disco: "preener",
  hiphop: undefined,
  electronic: undefined,
  classical: undefined,
  none: undefined
};

export const resolveTeamSilhouette = (
  team: Pick<Team, "genre"> | undefined
): CharacterSilhouette | undefined => {
  return SILHOUETTE_BY_GENRE_KEY[resolveGenreKey(team?.genre)];
};

// The genre's move on the beat, for a genre the shape axis cannot reach. It
// OVERRIDES the player's own hashed dance, so a pop team bounces together
// rather than four ways at once; every other genre leaves the dance to the
// player and stays a mixed floor.
const DANCE_BY_GENRE_KEY: Record<GenreKey, CharacterDance | undefined> = {
  metal: undefined,
  punk: undefined,
  rock: undefined,
  pop: "bounce",
  country: undefined,
  disco: undefined,
  hiphop: undefined,
  electronic: undefined,
  classical: undefined,
  none: undefined
};

export const resolveTeamDance = (
  team: Pick<Team, "genre"> | undefined
): CharacterDance | undefined => {
  return DANCE_BY_GENRE_KEY[resolveGenreKey(team?.genre)];
};
