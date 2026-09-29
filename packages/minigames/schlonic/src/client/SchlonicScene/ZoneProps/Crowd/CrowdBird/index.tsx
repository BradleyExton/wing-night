import { CHARACTER_FOOT, CharacterFigure, type CharacterAppearance, type CharacterSilhouette } from "@wingnight/cast";
import type { CharacterPose } from "@wingnight/cast";
import type { ReactNode } from "react";

/**
 * One of the crowd, as a bird: the cast's own figure (the hen every surface draws), stood on
 * its feet at a world point at `scale`, in the colour class its group carries. The crowd are
 * birds and not people because everything in the game is the cast — a human stood next to a
 * chicken on a skateboard would be the odd one out. `children` is whatever the bird is holding
 * or wearing, drawn in the figure's own 80×72 units so it stays put on the body.
 */
export const CrowdBird = ({
  x,
  y,
  scale,
  colorClassName,
  appearance,
  silhouette,
  pose = "still",
  lean = 0,
  children
}: {
  /** Where its feet are, in world units. */
  x: number;
  y: number;
  scale: number;
  colorClassName: string;
  appearance: CharacterAppearance;
  silhouette?: CharacterSilhouette;
  pose?: CharacterPose;
  /** Degrees about the feet: back for a slouch, forward for a stagger. */
  lean?: number;
  children?: ReactNode;
}): JSX.Element => (
  <g
    className={colorClassName}
    transform={`translate(${x} ${y}) rotate(${lean}) scale(${scale}) translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`}
  >
    <CharacterFigure appearance={appearance} silhouette={silhouette} pose={pose} />
    {children}
  </g>
);
