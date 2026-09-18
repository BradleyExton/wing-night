import type { Team } from "@wingnight/shared";

// What a team's birds wear on top of their colour, so a metal team looks like
// a metal team from across the room and not just like the red one. Keyed off
// the team's free-text `genre` (content/teams.json), which is optional, so a
// team without one, or with a genre nothing here matches, wears nothing.
export const CHARACTER_APPARELS = ["hat", "collar", "shades", "lapels"] as const;
export type CharacterApparel = (typeof CHARACTER_APPARELS)[number];

const APPAREL_BY_GENRE_KEYWORD: ReadonlyArray<readonly [string, CharacterApparel]> = [
  ["country", "hat"],
  ["metal", "collar"],
  ["rock", "collar"],
  ["punk", "collar"],
  ["pop", "shades"],
  ["disco", "lapels"],
  ["funk", "lapels"]
];

export const resolveTeamApparel = (
  team: Pick<Team, "genre"> | undefined
): CharacterApparel | undefined => {
  const genre = team?.genre?.trim().toLowerCase();
  if (genre === undefined || genre === "") {
    return undefined;
  }

  return APPAREL_BY_GENRE_KEYWORD.find(([keyword]) => genre.includes(keyword))?.[1];
};
