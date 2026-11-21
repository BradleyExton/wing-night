import { TEASER_ROOM_GAME_RULES, TEASER_ROOM_GAMES, isTeaserRoomCode, type TeaserRoomGame } from "@wingnight/shared";

/** A game's own page, its room page's prefix without the code: `/play`, `/base-borden`. */
const resolveGameHome = (game: TeaserRoomGame): string => TEASER_ROOM_GAME_RULES[game].page.replace(/\/$/, "");

/** The game whose room page a path is (`/play`, `/base-borden/<CODE>`), or null for any other page. */
export const resolveOnlineGameFromPath = (path: string): TeaserRoomGame | null =>
  TEASER_ROOM_GAMES.find((game) => path === resolveGameHome(game) || path.startsWith(TEASER_ROOM_GAME_RULES[game].page)) ?? null;

/** The room a `<page><CODE>` path names, or null for the game's page itself (or a code that is not one). */
export const resolveRoomCodeFromPath = (path: string, game: TeaserRoomGame = "BRAWL"): string | null => {
  const prefix = TEASER_ROOM_GAME_RULES[game].page;

  if (!path.startsWith(prefix)) {
    return null;
  }

  const code = path.slice(prefix.length).toUpperCase();

  return isTeaserRoomCode(code) ? code : null;
};
