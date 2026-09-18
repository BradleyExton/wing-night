import type { FappyGate } from "@wingnight/shared";
import { FAPPY_WORLD } from "@wingnight/shared";

import { fappyPalette } from "../palette.js";

export type EagleRefs = {
  eagle: SVGGElement | null;
  leftWing: SVGGElement | null;
  rightWing: SVGGElement | null;
};

// How far each wing swings about its shoulder over a beat, in degrees.
export const EAGLE_WINGBEAT_DEGREES = 22;

// Where the wings pivot, for the loop: the shoulders either side of the body.
export const resolveEagleShoulders = (
  gate: FappyGate,
  eagleBottom: number
): { leftX: number; rightX: number; y: number } => {
  const centreX = gate.x + FAPPY_WORLD.gateWidth / 2;
  const bodyY = eagleBottom - 4;

  return { leftX: centreX - 1.6, rightX: centreX + 1.6, y: bodyY - 1 };
};

// A feathered wing from the shoulder out to the tip: the leading edge is one
// sweep, the trailing edge is notched into primaries so the bird reads as a
// raptor and not a kite. `direction` −1 spreads it left, +1 right.
const resolveWingPath = (shoulderX: number, shoulderY: number, direction: number, top: number): string => {
  const d = direction;
  const tipX = shoulderX + d * 9.5;
  const tipY = top + 0.5;
  const notches = [
    [shoulderX + d * 8.6, tipY + 2.2],
    [shoulderX + d * 7.6, tipY + 1.4],
    [shoulderX + d * 6.8, tipY + 3.2],
    [shoulderX + d * 5.6, tipY + 2.4],
    [shoulderX + d * 4.6, tipY + 4.2],
    [shoulderX + d * 3.2, tipY + 3.4],
    [shoulderX + d * 2, tipY + 4.6]
  ]
    .map(([x, y]) => `L ${x} ${y}`)
    .join(" ");

  return `M ${shoulderX} ${shoulderY} Q ${shoulderX + d * 4} ${tipY - 0.6} ${tipX} ${tipY} ${notches} Z`;
};

// A bald eagle hanging in the sky over a gate, wings out, talons down,
// looking at the bird coming. The wings pivot on the shoulders each frame.
export const Eagle = ({
  gate,
  eagleBottom,
  registerRefs
}: {
  gate: FappyGate;
  eagleBottom: number;
  registerRefs: (part: keyof EagleRefs, element: SVGGElement | null) => void;
}): JSX.Element => {
  const { gateWidth, eagleHeight } = FAPPY_WORLD;
  const centreX = gate.x + gateWidth / 2;
  const top = eagleBottom - eagleHeight;
  const bodyY = eagleBottom - 4;
  const shoulders = resolveEagleShoulders(gate, eagleBottom);
  const feather = { fill: fappyPalette.eagle, stroke: fappyPalette.eagleDark, strokeWidth: 0.35, strokeLinejoin: "round" as const };

  return (
    <g data-fappy-eagle ref={(element): void => registerRefs("eagle", element)}>
      <path
        d={`M ${centreX + 2.4} ${bodyY - 0.6} L ${centreX + 6.4} ${bodyY - 1.4} L ${centreX + 6} ${bodyY + 0.2} L ${centreX + 6.6} ${bodyY + 1.4} L ${centreX + 2.6} ${bodyY + 1.4} Z`}
        fill={fappyPalette.eagleHead}
        stroke={fappyPalette.eagleDark}
        strokeWidth={0.3}
        strokeLinejoin="round"
      />
      <g ref={(element): void => registerRefs("leftWing", element)}>
        <path d={resolveWingPath(shoulders.leftX, shoulders.y, -1, top)} {...feather} />
        <path
          d={`M ${shoulders.leftX - 1} ${shoulders.y + 0.4} Q ${shoulders.leftX - 4.5} ${top + 1.6} ${shoulders.leftX - 8} ${top + 1.4}`}
          stroke={fappyPalette.eagleFeather}
          strokeWidth={0.45}
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <g ref={(element): void => registerRefs("rightWing", element)}>
        <path d={resolveWingPath(shoulders.rightX, shoulders.y, 1, top)} {...feather} />
        <path
          d={`M ${shoulders.rightX + 1} ${shoulders.y + 0.4} Q ${shoulders.rightX + 4.5} ${top + 1.6} ${shoulders.rightX + 8} ${top + 1.4}`}
          stroke={fappyPalette.eagleFeather}
          strokeWidth={0.45}
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <ellipse cx={centreX} cy={bodyY} rx={3.4} ry={2.2} {...feather} strokeWidth={0.4} />
      <path
        d={`M ${centreX - 1.4} ${eagleBottom - 2} L ${centreX - 1.9} ${eagleBottom} M ${centreX - 1.9} ${eagleBottom} L ${centreX - 2.6} ${eagleBottom + 0.3} M ${centreX - 1.9} ${eagleBottom} L ${centreX - 1.3} ${eagleBottom + 0.4} M ${centreX + 1.4} ${eagleBottom - 2} L ${centreX + 1.9} ${eagleBottom} M ${centreX + 1.9} ${eagleBottom} L ${centreX + 1.2} ${eagleBottom + 0.3} M ${centreX + 1.9} ${eagleBottom} L ${centreX + 2.6} ${eagleBottom + 0.4}`}
        stroke={fappyPalette.eagleBeak}
        strokeWidth={0.5}
        strokeLinecap="round"
      />
      <circle cx={centreX - 3.7} cy={bodyY - 1.5} r={1.75} fill={fappyPalette.eagleHead} stroke={fappyPalette.eagleDark} strokeWidth={0.3} />
      <path
        d={`M ${centreX - 5.1} ${bodyY - 2.1} L ${centreX - 7} ${bodyY - 1.4} Q ${centreX - 6.4} ${bodyY - 0.6} ${centreX - 5.6} ${bodyY - 0.9} L ${centreX - 5} ${bodyY - 0.7} Z`}
        fill={fappyPalette.eagleBeak}
        stroke={fappyPalette.eagleDark}
        strokeWidth={0.25}
        strokeLinejoin="round"
      />
      <path
        d={`M ${centreX - 5} ${bodyY - 2.4} L ${centreX - 3.6} ${bodyY - 2.2}`}
        stroke={fappyPalette.eagleDark}
        strokeWidth={0.4}
        strokeLinecap="round"
      />
      <circle cx={centreX - 4.2} cy={bodyY - 1.9} r={0.4} fill={fappyPalette.pupil} />
    </g>
  );
};
