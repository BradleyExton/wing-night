import {
  resolveCharacterFillClassName,
  resolvePlayerAppearance,
  resolveTeamApparel,
  resolveTeamSilhouette,
  type CharacterAppearance,
  type CharacterApparel,
  type CharacterSilhouette
} from "@wingnight/cast";
import type { MountPlayerFigure } from "@wingnight/shared";

export type HenFigure = {
  playerName: string | null;
  appearance: CharacterAppearance;
  apparel: CharacterApparel | undefined;
  silhouette: CharacterSilhouette | undefined;
  /** The `text-*` class the bird is painted in: its team's colour. */
  fillClassName: string;
};

// The hen nobody is wearing: a climb with no seated player, or a pile hen whose player has left
// the roster. Still a team's colour where one is known.
const ANONYMOUS_APPEARANCE: CharacterAppearance = {
  body: "round",
  comb: "crest",
  tail: "fan",
  dance: "bounce"
};

/**
 * What a hen on the pile or on the climb looks like: the player's own cast hen — the bird in the
 * lobby parade — wearing their head, in their team's colour and their genre's shape. `avatarSrc`
 * is pack-relative in the view and resolved against the server origin here, because the client
 * and the server are always separate origins. Never a private bird (spec §0.8).
 */
export const resolveHenFigure = (
  figure: MountPlayerFigure | null,
  fallbackTeamId: string | null,
  serverOrigin: string | null
): HenFigure => {
  if (figure === null) {
    return {
      playerName: null,
      appearance: ANONYMOUS_APPEARANCE,
      apparel: undefined,
      silhouette: undefined,
      fillClassName: resolveCharacterFillClassName(fallbackTeamId)
    };
  }

  return {
    playerName: figure.name,
    appearance: resolvePlayerAppearance({ name: figure.name, avatarSrc: figure.avatarSrc ?? undefined }, serverOrigin),
    apparel: resolveTeamApparel({ genre: figure.genre ?? undefined }),
    silhouette: resolveTeamSilhouette({ genre: figure.genre ?? undefined }),
    fillClassName: resolveCharacterFillClassName(figure.teamId ?? fallbackTeamId)
  };
};
