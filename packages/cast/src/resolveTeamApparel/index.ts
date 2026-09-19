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

const APPAREL_BY_GENRE_KEY: Record<GenreKey, CharacterApparel | undefined> = {
  metal: "collar",
  punk: "collar",
  rock: "collar",
  pop: "shades",
  country: "hat",
  disco: "medallion",
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
