import type { FappyGate } from "@wingnight/shared";
import { FAPPY_WORLD } from "@wingnight/shared";

import { fappyPalette } from "../palette.js";

export const CHAMP_HEAD_RADIUS = 3.5;

export type ChampRefs = {
  shaft: SVGRectElement | null;
  head: SVGGElement | null;
};

// One champ standing up from the floor, its head at the top of its reach.
// The loop grows and shrinks the shaft and moves the head on every frame;
// the balls stay on the sand. Lit from the left: a gradient down the shaft,
// a highlight on the head and on each ball, so it reads as a solid thing
// and not a flat cyan bar at TV distance.
export const Champ = ({
  gate,
  shaftGradientId,
  headGradientId,
  registerRefs
}: {
  gate: FappyGate;
  shaftGradientId: string;
  headGradientId: string;
  registerRefs: (part: keyof ChampRefs, element: SVGRectElement | SVGGElement | null) => void;
}): JSX.Element => {
  const { gateWidth, floorY } = FAPPY_WORLD;
  const centreX = gate.x + gateWidth / 2;
  const headY = gate.champTop + CHAMP_HEAD_RADIUS;
  const stroke = { stroke: fappyPalette.champDark, strokeWidth: 0.6 };

  return (
    <g data-fappy-champ>
      <circle cx={gate.x + 1.5} cy={floorY - 2.5} r={3} fill={fappyPalette.champ} {...stroke} />
      <circle cx={gate.x + gateWidth - 1.5} cy={floorY - 2.5} r={3} fill={fappyPalette.champ} {...stroke} />
      <circle cx={gate.x + 0.6} cy={floorY - 3.6} r={0.8} fill={fappyPalette.champLight} opacity={0.8} />
      <circle cx={gate.x + gateWidth - 2.4} cy={floorY - 3.6} r={0.8} fill={fappyPalette.champLight} opacity={0.8} />
      <rect
        ref={(element): void => registerRefs("shaft", element)}
        x={gate.x + 2}
        y={headY}
        width={gateWidth - 4}
        height={floorY + 4 - headY}
        rx={3}
        fill={`url(#${shaftGradientId})`}
        {...stroke}
      />
      <g ref={(element): void => registerRefs("head", element)}>
        <circle cx={centreX} cy={headY} r={CHAMP_HEAD_RADIUS} fill={`url(#${headGradientId})`} {...stroke} />
        <ellipse cx={centreX - 1.3} cy={headY - 1.6} rx={1.1} ry={0.6} fill={fappyPalette.champLight} opacity={0.85} />
        <circle cx={centreX - 2} cy={headY - 0.8} r={0.8} fill={fappyPalette.eye} />
        <circle cx={centreX + 0.8} cy={headY - 0.8} r={0.8} fill={fappyPalette.eye} />
        <circle cx={centreX - 2.3} cy={headY - 0.8} r={0.4} fill={fappyPalette.pupil} />
        <circle cx={centreX + 0.5} cy={headY - 0.8} r={0.4} fill={fappyPalette.pupil} />
        <path
          d={`M ${centreX - 1.6} ${headY + 1.2} Q ${centreX - 0.6} ${headY + 2} ${centreX + 0.4} ${headY + 1.2}`}
          stroke={fappyPalette.champDark}
          strokeWidth={0.35}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
};

// The gradients every champ in a scene shares; one set per scene, keyed by
// the scene so two scenes on one page never fight over an id.
export const ChampDefs = ({
  shaftGradientId,
  headGradientId
}: {
  shaftGradientId: string;
  headGradientId: string;
}): JSX.Element => (
  <defs>
    <linearGradient id={shaftGradientId} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={fappyPalette.champDark} />
      <stop offset="28%" stopColor={fappyPalette.champ} />
      <stop offset="45%" stopColor={fappyPalette.champBlush} />
      <stop offset="70%" stopColor={fappyPalette.champ} />
      <stop offset="100%" stopColor={fappyPalette.champDark} />
    </linearGradient>
    <radialGradient id={headGradientId} cx="38%" cy="35%" r="70%">
      <stop offset="0%" stopColor={fappyPalette.champBlush} />
      <stop offset="60%" stopColor={fappyPalette.champ} />
      <stop offset="100%" stopColor={fappyPalette.champDark} />
    </radialGradient>
  </defs>
);
