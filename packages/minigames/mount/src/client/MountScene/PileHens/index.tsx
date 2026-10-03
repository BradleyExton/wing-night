import { memo } from "react";
import { CharacterRagdollFigure } from "@wingnight/cast";
import type { MountPile, MountPlayerFigure } from "@wingnight/shared";

import { resolveHenFigure } from "../../resolveHenFigure/index.js";
import { resolvePileKey } from "../pileKey/index.js";
import { resolveRagdollTransforms } from "../ragdollTransforms/index.js";

type PileHensProps = {
  pile: MountPile;
  figures: Record<string, MountPlayerFigure>;
  serverOrigin: string | null;
};

/**
 * Every hen stuck on the pile, frozen exactly where its climb ended, each the player's own cast
 * hen wearing their head (spec §0.8). Drawn in pile order, so a later climber lies over the
 * earlier ones it stood on. Memoised on the pile's key: the server hands a fresh copy of the same
 * pile on every echo, and these never redraw during a climb.
 */
const PileHensLayer = ({ pile, figures, serverOrigin }: PileHensProps): JSX.Element => (
  <g data-mount-pile>
    {pile.hens.map((hen) => {
      const figure = resolveHenFigure(hen.playerId === null ? null : (figures[hen.playerId] ?? null), null, serverOrigin);

      return (
        <g
          key={hen.pileIndex}
          className={figure.fillClassName}
          data-mount-pile-hen={hen.pileIndex}
          data-mount-player-id={hen.playerId ?? ""}
          data-mount-mounted={hen.mounted ? "true" : "false"}
        >
          <CharacterRagdollFigure
            appearance={figure.appearance}
            apparel={figure.apparel}
            silhouette={figure.silhouette}
            transforms={resolveRagdollTransforms(hen.pose)}
          />
        </g>
      );
    })}
  </g>
);

const resolveFiguresKey = (figures: Record<string, MountPlayerFigure>): string => {
  return Object.values(figures)
    .map((figure) => `${figure.playerId}:${figure.name}:${figure.avatarSrc ?? ""}:${figure.teamId ?? ""}:${figure.genre ?? ""}`)
    .sort()
    .join("|");
};

export const PileHens = memo(PileHensLayer, (previous, next) => {
  return (
    previous.serverOrigin === next.serverOrigin &&
    resolvePileKey(previous.pile) === resolvePileKey(next.pile) &&
    resolveFiguresKey(previous.figures) === resolveFiguresKey(next.figures)
  );
});
