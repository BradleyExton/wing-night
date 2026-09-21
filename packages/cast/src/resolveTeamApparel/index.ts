import {
  CHARACTER_APPARELS,
  resolveGenreKey,
  type CharacterApparel,
  type GenreKey,
  type Team
} from "@wingnight/shared";

// What a team's birds wear on top of their colour, so a metal team looks like
// a metal team from across the room and not just like the red one. Keyed off
// the team's free-text `genre` (content/teams.json) through the one genre
// vocabulary in @wingnight/shared, so the apparel and the rest of the team's
// kit (docs/team-identity.md) can never disagree about what "funk" is. A team
// without a genre, or with one nothing matches, wears nothing.
export { CHARACTER_APPARELS, type CharacterApparel };

// A genre carries itself ONE way. Where `resolveTeamSilhouette` gives the
// genre a shape, the bird IS the statement and a prop on top of it only
// competes — the spiky bird and a mark on its wing are the same message ten
// units apart, and the mark wins an argument you did not want to have. So
// metal, punk, rock, country and disco wear nothing: they are shaped instead.
//
// Pop keeps the shades because pop is the one genre the shape axis cannot
// reach — "smooth, round, upright" is the stock bird — so its carriers are the
// team dance and, for a player with no generated head, these.
const APPAREL_BY_GENRE_KEY: Record<GenreKey, CharacterApparel | undefined> = {
  metal: undefined,
  punk: undefined,
  rock: undefined,
  pop: "shades",
  country: undefined,
  disco: undefined,
  hiphop: undefined,
  electronic: undefined,
  classical: undefined,
  none: undefined
};

export const resolveTeamApparel = (
  team: Pick<Team, "genre"> | undefined
): CharacterApparel | undefined => {
  return APPAREL_BY_GENRE_KEY[resolveGenreKey(team?.genre)];
};
