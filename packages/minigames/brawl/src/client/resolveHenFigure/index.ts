import {
  resolveCharacterFillClassName,
  resolvePlayerAppearance,
  resolveTeamApparel,
  resolveTeamSilhouette,
  type CharacterAppearance,
  type CharacterApparel,
  type CharacterSilhouette
} from "@wingnight/cast";
import type { BrawlPlayerFigure } from "@wingnight/shared";

export type HenFigure = {
  playerName: string | null;
  appearance: CharacterAppearance;
  apparel: CharacterApparel | undefined;
  silhouette: CharacterSilhouette | undefined;
  /** The `text-*` class the bird is painted in: its team's colour, off the standings table. */
  fillClassName: string;
};

// The hen nobody is wearing: a team with no roster. Still the team's colour.
const ANONYMOUS_APPEARANCE: CharacterAppearance = {
  body: "round",
  comb: "crest",
  tail: "fan",
  dance: "bounce"
};

type ResolveHenFigureInput = {
  figure: BrawlPlayerFigure | null;
  activeTurnTeamId: string | null;
  serverOrigin: string | null;
};

/**
 * What a block's brawler looks like: the player's own cast hen — the bird that stands in the
 * lobby parade and skates SCHLONIC's zone — wearing their head, in their team's colour and their
 * genre's shape. `avatarSrc` stays pack-relative in the view and is resolved against the server
 * origin here, because the client and the server are always separate origins.
 */
export const resolveHenFigure = ({ figure, activeTurnTeamId, serverOrigin }: ResolveHenFigureInput): HenFigure => {
  if (figure === null) {
    return {
      playerName: null,
      appearance: ANONYMOUS_APPEARANCE,
      apparel: undefined,
      silhouette: undefined,
      fillClassName: resolveCharacterFillClassName(activeTurnTeamId)
    };
  }

  return {
    playerName: figure.name,
    appearance: resolvePlayerAppearance({ name: figure.name, avatarSrc: figure.avatarSrc ?? undefined }, serverOrigin),
    apparel: resolveTeamApparel({ genre: figure.genre ?? undefined }),
    silhouette: resolveTeamSilhouette({ genre: figure.genre ?? undefined }),
    fillClassName: resolveCharacterFillClassName(figure.teamId ?? activeTurnTeamId)
  };
};
