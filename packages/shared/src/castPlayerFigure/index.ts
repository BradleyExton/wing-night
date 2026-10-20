import { isRecord } from "../guards/index.js";
import { isOutfit, resolvePlayerOutfit, type Outfit } from "../outfit/index.js";
import type { Player } from "../player/index.js";
import type { Team } from "../team/index.js";
import { resolveGenreKey } from "../teamTheme/index.js";

// One player as a game's cast bird needs them drawn — JOUST's lane, FAPPY's
// leg, Dunlop Dash's run, BRAWL's block and MOUNT's climb all carry this
// (each under its own name, which is an alias of this one). It used to be five
// copies built field by field in five runtimes, so a new thing a bird wears
// meant five changes that could disagree; now it is one.
//
// `avatarSrc` stays PACK-RELATIVE: the surface that draws the head resolves it
// against the server origin, because the client and server are always separate
// origins. `teamId` and `genre` are the bird's colour and its shape, carried as
// the data they are so a runtime never names a UI class. `outfit` is what the
// bird wears for that team's genre, already read tolerantly on the server
// (`resolvePlayerOutfit`), so a surface hands it straight to the cast. A game
// draws only the kit of it; Prop and Stage are for birds on show.
export type CastPlayerFigure = {
  playerId: string;
  name: string;
  avatarSrc: string | null;
  teamId: string | null;
  genre: string | null;
  outfit: Outfit | null;
};

/** The figure for a player standing with `team`, or with nobody (bare, uncoloured). */
export const toCastPlayerFigure = (
  player: Player,
  team: Pick<Team, "id" | "genre"> | null | undefined
): CastPlayerFigure => {
  const genre = team?.genre ?? null;

  return {
    playerId: player.id,
    name: player.name,
    avatarSrc: player.avatarSrc ?? null,
    teamId: team?.id ?? null,
    genre,
    outfit: team === null || team === undefined ? null : (resolvePlayerOutfit(player, resolveGenreKey(genre ?? undefined)) ?? null)
  };
};

const isStringOrNull = (value: unknown): value is string | null => value === null || typeof value === "string";

export const isCastPlayerFigure = (value: unknown): value is CastPlayerFigure => {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.name === "string" &&
    isStringOrNull(value.avatarSrc) &&
    isStringOrNull(value.teamId) &&
    isStringOrNull(value.genre) &&
    (value.outfit === null || isOutfit(value.outfit))
  );
};
