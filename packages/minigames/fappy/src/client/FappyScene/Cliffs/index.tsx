import { FAPPY_WORLD, resolveFappyLandingX, resolveFappyWaitingX } from "@wingnight/shared";

import { fappyPalette } from "../palette.js";

// How far the cliffs run off either edge of the world.
const CLIFF_OVERRUN = 400;

// A tuft of desert grass, its roots at (x, y).
const Tuft = ({ x, y, flip = false }: { x: number; y: number; flip?: boolean }): JSX.Element => {
  const d = flip ? -1 : 1;

  return (
    <path
      d={`M ${x} ${y} Q ${x - 1.6 * d} ${y - 2.4} ${x - 2.4 * d} ${y - 4.6} M ${x} ${y} Q ${x + 0.2 * d} ${y - 3} ${x + 0.4 * d} ${y - 5.4} M ${x} ${y} Q ${x + 1.8 * d} ${y - 2.2} ${x + 2.8 * d} ${y - 3.8}`}
      stroke={fappyPalette.cactus}
      strokeWidth={0.6}
      strokeLinecap="round"
      fill="none"
    />
  );
};

// A small barrel cactus on a plateau.
const Cactus = ({ x, y }: { x: number; y: number }): JSX.Element => (
  <g>
    <rect x={x - 1.6} y={y - 6} width={3.2} height={6} rx={1.6} fill={fappyPalette.cactus} stroke={fappyPalette.cactusDark} strokeWidth={0.4} />
    <path d={`M ${x - 0.6} ${y - 5} L ${x - 0.6} ${y - 1} M ${x + 0.6} ${y - 5} L ${x + 0.6} ${y - 1}`} stroke={fappyPalette.cactusDark} strokeWidth={0.3} strokeLinecap="round" />
  </g>
);

// The two cliffs: the one the leg takes off from, running off the left edge
// of the world, and the landing cliff at the far end with the rock wall that
// closes the sky beyond its plateau. Strata lines and a few tufts give the
// sand a surface; a gold dashed strip along the landing plateau says where
// to come down, from the sofa as well as the tablet.
export const Cliffs = ({ gatesPerLeg }: { gatesPerLeg: number }): JSX.Element => {
  const { cliffTop, floorY, startCliffEnd, landingZoneWidth } = FAPPY_WORLD;
  const landingX = resolveFappyLandingX(gatesPerLeg);
  const wallX = landingX + landingZoneWidth;
  const cliffStroke = { stroke: fappyPalette.cliffEdge, strokeWidth: 0.8, strokeLinejoin: "round" as const };
  const strata = { stroke: fappyPalette.cliffEdge, strokeWidth: 0.5, fill: "none", opacity: 0.45, strokeLinecap: "round" as const };

  return (
    <g data-fappy-cliffs>
      <path
        d={`M ${-CLIFF_OVERRUN} ${cliffTop} L ${startCliffEnd - 2} ${cliffTop} Q ${startCliffEnd + 1} ${cliffTop + 2} ${startCliffEnd} ${cliffTop + 8} L ${startCliffEnd - 3} ${floorY + 4} L ${-CLIFF_OVERRUN} ${floorY + 4} Z`}
        fill={fappyPalette.cliff}
        {...cliffStroke}
      />
      <path d={`M ${-CLIFF_OVERRUN} ${cliffTop + 1.2} L ${startCliffEnd - 3} ${cliffTop + 1.2}`} stroke={fappyPalette.cliffLight} strokeWidth={1.2} opacity={0.5} />
      <path d={`M ${startCliffEnd - 60} ${cliffTop + 7} q 14 1 28 0 t 26 1 M ${startCliffEnd - 48} ${cliffTop + 14} q 12 1.2 24 0 t 20 0.8`} {...strata} />
      <Tuft x={startCliffEnd - 12} y={cliffTop} />
      <Tuft x={startCliffEnd - 42} y={cliffTop} flip />
      <path
        d={`M ${landingX} ${cliffTop + 8} Q ${landingX - 1} ${cliffTop + 2} ${landingX + 2} ${cliffTop} L ${wallX} ${cliffTop} L ${wallX + CLIFF_OVERRUN} ${cliffTop} L ${wallX + CLIFF_OVERRUN} ${floorY + 4} L ${landingX + 3} ${floorY + 4} Z`}
        fill={fappyPalette.cliff}
        {...cliffStroke}
      />
      <path d={`M ${landingX + 3} ${cliffTop + 1.2} L ${wallX + CLIFF_OVERRUN} ${cliffTop + 1.2}`} stroke={fappyPalette.cliffLight} strokeWidth={1.2} opacity={0.5} />
      <path d={`M ${landingX + 4} ${cliffTop + 8} q 10 1 20 0 t 18 0.8 M ${landingX + 8} ${cliffTop + 15} q 9 -1 18 0 t 14 0.6`} {...strata} />
      <line
        x1={landingX + 5}
        y1={cliffTop - 0.6}
        x2={wallX - 4}
        y2={cliffTop - 0.6}
        stroke={fappyPalette.strip}
        strokeWidth={0.7}
        strokeDasharray="2.4 1.6"
        strokeLinecap="round"
        opacity={0.8}
        data-fappy-landing-strip
      />
      <Cactus x={wallX - 5} y={cliffTop} />
      <Tuft x={landingX + 7} y={cliffTop} flip />
      <path
        d={`M ${wallX} ${cliffTop} L ${wallX + 2} ${cliffTop - 30} L ${wallX + 6} ${cliffTop - 52} L ${wallX + 3} ${-CLIFF_OVERRUN} L ${wallX + CLIFF_OVERRUN} ${-CLIFF_OVERRUN} L ${wallX + CLIFF_OVERRUN} ${cliffTop} Z`}
        fill={fappyPalette.rock}
        stroke={fappyPalette.rockEdge}
        strokeWidth={0.8}
        strokeLinejoin="round"
        data-fappy-wall
      />
      <path
        d={`M ${wallX + 2.2} ${cliffTop - 28} L ${wallX + 6} ${cliffTop - 50} L ${wallX + 10} ${cliffTop - 70} L ${wallX + 9} ${cliffTop - 12} L ${wallX + 4} ${cliffTop - 6} Z`}
        fill={fappyPalette.rockLight}
        opacity={0.7}
      />
      <path
        d={`M ${wallX + 6} ${cliffTop - 20} l 4 -6 l -2 -6 M ${wallX + 9} ${cliffTop - 44} l 3 -5 l -1 -7`}
        stroke={fappyPalette.rockEdge}
        strokeWidth={0.5}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
};

// A little pennant on the last leg's landing cliff: nobody is waiting there,
// the finish is.
export const FinishFlag = ({ gatesPerLeg }: { gatesPerLeg: number }): JSX.Element => {
  const x = resolveFappyWaitingX(gatesPerLeg);
  const top = FAPPY_WORLD.cliffTop;

  return (
    <g data-fappy-finish-flag>
      <line x1={x} y1={top} x2={x} y2={top - 16} stroke={fappyPalette.pole} strokeWidth={0.8} strokeLinecap="round" />
      <path d={`M ${x} ${top - 16} L ${x + 9} ${top - 13} L ${x} ${top - 10} Z`} fill={fappyPalette.flag} stroke={fappyPalette.flagEdge} strokeWidth={0.5} />
      <path d={`M ${x + 1.5} ${top - 14.4} L ${x + 5.5} ${top - 13} L ${x + 1.5} ${top - 11.6}`} stroke={fappyPalette.flagEdge} strokeWidth={0.35} fill="none" opacity={0.6} />
    </g>
  );
};
