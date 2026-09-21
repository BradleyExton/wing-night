import {
  resolveCharacterFillClassName,
  resolvePlayerAppearance,
  resolveTeamApparel,
  resolveTeamSilhouette,
  type CharacterAppearance,
  type CharacterApparel,
  type CharacterSilhouette
} from "@wingnight/cast";
import type { SchlonicPlayerFigure } from "@wingnight/shared";

export type RunnerFigure = {
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

type ResolveRunnerFigureInput = {
  figure: SchlonicPlayerFigure | null;
  activeTurnTeamId: string | null;
  serverOrigin: string | null;
};

/**
 * What a run's runner looks like. The zone is run by the player's own cast hen — the same bird
 * that stands in the lobby parade and flies FAPPY's corridor — so this turns the runtime's
 * figure (name, pack-relative head, team, genre — the JOUST convention) into a face, a colour
 * and an outfit for the cast to draw. The schlongs are the scenery here, not the runner.
 */
export const resolveRunnerFigure = ({
  figure,
  activeTurnTeamId,
  serverOrigin
}: ResolveRunnerFigureInput): RunnerFigure => {
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
    appearance: resolvePlayerAppearance(
      { name: figure.name, avatarSrc: figure.avatarSrc ?? undefined },
      serverOrigin
    ),
    apparel: resolveTeamApparel({ genre: figure.genre ?? undefined }),
    silhouette: resolveTeamSilhouette({ genre: figure.genre ?? undefined }),
    fillClassName: resolveCharacterFillClassName(figure.teamId ?? activeTurnTeamId)
  };
};
