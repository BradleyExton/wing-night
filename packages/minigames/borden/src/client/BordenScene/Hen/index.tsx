import { memo } from "react";
import { CHARACTER_FOOT, CHARACTER_STAND_HEIGHT, CharacterFigure, type CharacterPose, type CharacterSpray } from "@wingnight/cast";
import type { HenFigure } from "@wingnight/minigames-brawl/client";
import { BORDEN_WORLD, type BordenHen } from "@wingnight/shared";

import { BORDEN_GROUND_Y, round2, toScreenY } from "../frameGeometry.js";
import { resolveBordenHenArt } from "../../henArt/index.js";
import { bordenNight as ink } from "../palette.js";

/** The cast bird stood at the sim's height: her costume head's middle is the top of her box. */
const HEN_SCALE = round2(BORDEN_WORLD.henHeight / CHARACTER_STAND_HEIGHT);
const FIGURE_TRANSFORM = `translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`;
const REVIVE_RADIUS = 8;
const REVIVE_LENGTH = round2(2 * Math.PI * REVIVE_RADIUS);

type ArtProps = { figure: HenFigure; pose: CharacterPose; angle: number | null; tone: CharacterSpray["tone"] };

// Re-rendered only when what she is doing changes, so the walk's own CSS runs undisturbed between.
const HenArt = memo(({ figure, pose, angle, tone }: ArtProps): JSX.Element => (
  <g transform={FIGURE_TRANSFORM} className={figure.fillClassName}>
    <CharacterFigure
      appearance={figure.appearance}
      apparel={figure.apparel}
      silhouette={figure.silhouette}
      pose={pose}
      {...(angle === null ? {} : { spray: { angle, tone } })}
    />
  </g>
));

HenArt.displayName = "HenArt";

export type HenProps = {
  hen: BordenHen;
  tick: number;
  figure: HenFigure;
  /** Her player's slot colour: the ring she stands in and her name's ink, the same as her pad. */
  colour: string;
  tag: string;
  tagClassName: string;
  /** This phone's own hen: her ring is drawn bolder. */
  isOwn: boolean;
};

/**
 * One player's own cast hen on the base: her head, her team's colour and shape, in a ring of her
 * slot's colour on the ground under her, her name over her, flickering while she cannot be hit,
 * and, when she is down, the revive ring closing round her as her partner stands over her.
 */
export const Hen = ({ hen, tick, figure, colour, tag, tagClassName, isOwn }: HenProps): JSX.Element => {
  const art = resolveBordenHenArt(hen, tick);
  const isFlickering = hen.state === "up" && tick < hen.invulnerableUntilTick && Math.floor(tick / 4) % 2 === 1;
  const opacity = hen.state === "away" ? 0.5 : isFlickering ? 0.35 : 1;
  const revive = hen.state === "down" && hen.reviveSinceTick !== null ? Math.min(1, (tick - hen.reviveSinceTick) / BORDEN_WORLD.reviveTicks) : 0;
  const feetY = toScreenY(hen.y);

  return (
    <g
      data-borden-hen={hen.slot}
      data-borden-x={round2(hen.x)}
      data-borden-y={round2(hen.y)}
      data-borden-hen-state={hen.state}
      data-borden-pose={art.pose}
      data-borden-bottle={hen.bottle}
      data-borden-hearts={hen.hearts}
    >
      <ellipse cx={round2(hen.x)} cy={BORDEN_GROUND_Y + 0.4} rx={6} ry={1.4} fill={ink.shadow} />
      <ellipse cx={round2(hen.x)} cy={BORDEN_GROUND_Y + 0.4} rx={7} ry={1.9} fill="none" stroke={colour} strokeWidth={isOwn ? 1 : 0.6} />
      <g opacity={opacity} transform={`translate(${round2(hen.x)} ${feetY}) scale(${hen.facing * HEN_SCALE} ${HEN_SCALE})`}>
        <HenArt figure={figure} pose={art.pose} angle={art.spray?.angle ?? null} tone={art.spray?.tone ?? "mild"} />
      </g>
      {revive > 0 && (
        <circle
          cx={round2(hen.x)}
          cy={BORDEN_GROUND_Y - 6}
          r={REVIVE_RADIUS}
          fill="none"
          stroke={colour}
          strokeWidth={1}
          strokeDasharray={`${round2(revive * REVIVE_LENGTH)} ${REVIVE_LENGTH}`}
          transform={`rotate(-90 ${round2(hen.x)} ${BORDEN_GROUND_Y - 6})`}
        />
      )}
      <text className={tagClassName} x={round2(hen.x)} y={round2(feetY - BORDEN_WORLD.henHeight - 9)} textAnchor="middle" fill={colour}>
        {tag}
      </text>
    </g>
  );
};
