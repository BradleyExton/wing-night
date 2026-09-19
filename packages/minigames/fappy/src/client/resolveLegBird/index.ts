import {
  resolveCharacterFillClassName,
  resolvePlayerAppearance,
  resolveTeamApparel,
  type CharacterApparel,
  type CharacterAppearance
} from "@wingnight/cast";
import type { FappyPlayerFigure } from "@wingnight/shared";

export type LegBird = {
  playerName: string | null;
  appearance: CharacterAppearance;
  apparel: CharacterApparel | undefined;
  fillClassName: string;
};

// The hen nobody is wearing: a team with no roster. Still the team's colour.
const ANONYMOUS_APPEARANCE: CharacterAppearance = { body: "round", comb: "crest", tail: "fan", dance: "bounce" };

type ResolveLegBirdInput = {
  figure: FappyPlayerFigure | null;
  activeTurnTeamId: string | null;
  serverOrigin: string | null;
};

// What a leg's bird looks like. The runtime's view carries the player as a
// figure (name, pack-relative head, team, genre — the JOUST convention), and
// this turns that into a face, a colour and an outfit for the cast to draw.
export const resolveLegBird = ({ figure, activeTurnTeamId, serverOrigin }: ResolveLegBirdInput): LegBird => {
  if (figure === null) {
    return {
      playerName: null,
      appearance: ANONYMOUS_APPEARANCE,
      apparel: undefined,
      fillClassName: resolveCharacterFillClassName(activeTurnTeamId)
    };
  }

  return {
    playerName: figure.name,
    appearance: resolvePlayerAppearance(
      { name: figure.name, avatarSrc: figure.avatarSrc ?? undefined },
      serverOrigin
    ),
    apparel: resolveTeamApparel({ genre: figure.genre ?? undefined }),
    fillClassName: resolveCharacterFillClassName(figure.teamId ?? activeTurnTeamId)
  };
};
