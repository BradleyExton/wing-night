import { FAPPY_WORLD, resolveFappyLandingX, resolveFappyWaitingX } from "@wingnight/shared";

import { fappyPalette } from "../palette.js";

// How far the buildings run off either edge of the world.
const CLIFF_OVERRUN = 400;
// The coping stands this far proud of a face, and is this deep.
const COPING_LIP = 0.4;
const COPING_DEPTH = 1.3;

type WindowGrid = { columns: readonly number[]; rows: readonly number[]; width: number; height: number };

// Every window on a face as three paths — the panes, a glint across each, the
// sills — so a block of forty windows is three elements, not a hundred and twenty.
const resolveWindows = ({ columns, rows, width, height }: WindowGrid): { panes: string; glints: string; sills: string } => {
  const panes: string[] = [];
  const glints: string[] = [];
  const sills: string[] = [];

  for (const top of rows) {
    for (const left of columns) {
      panes.push(`M ${left} ${top} h ${width} v ${height} h ${-width} Z`);
      glints.push(
        `M ${left + width * 0.15} ${top + height * 0.8} L ${left + width * 0.5} ${top + height * 0.15} L ${left + width * 0.75} ${top + height * 0.15} L ${left + width * 0.4} ${top + height * 0.8} Z`
      );
      sills.push(`M ${left - 0.3} ${top + height} h ${width + 0.6} v 0.5 h ${-(width + 0.6)} Z`);
    }
  }

  return { panes: panes.join(" "), glints: glints.join(" "), sills: sills.join(" ") };
};

const Windows = ({ grid }: { grid: WindowGrid }): JSX.Element => {
  const { panes, glints, sills } = resolveWindows(grid);

  return (
    <g>
      <path d={panes} fill={fappyPalette.window} />
      <path d={glints} fill={fappyPalette.windowGlint} opacity={0.3} />
      <path d={sills} fill={fappyPalette.sill} />
    </g>
  );
};

// Evenly spaced from `from` to `to`, `step` apart.
const resolveSpan = (from: number, to: number, step: number): number[] =>
  Array.from({ length: Math.max(0, Math.floor((to - from) / step) + 1) }, (_unused, index) => from + index * step);

// A scatter of darker bricks over a face, laid by a fixed stride rather than
// at random so the tablet and the TV lay the same wall.
const resolveDarkBricks = (left: number, width: number, top: number, height: number, count: number): string =>
  Array.from({ length: count }, (_unused, index) => {
    const x = left + 0.6 + ((index * 11.3) % (width - 2.6));
    const y = top + 2 + ((index * 5.7) % (height - 3));

    return `M ${x} ${y} h 1.9 v 0.75 h -1.9 Z`;
  }).join(" ");

// A roofline's coping: a pale concrete cap a lip proud of the face, with its
// shadow under it. Its top IS the roof the bird stands on.
const Coping = ({ from, to }: { from: number; to: number }): JSX.Element => {
  const { cliffTop } = FAPPY_WORLD;

  return (
    <g>
      <rect x={from} y={cliffTop + COPING_DEPTH} width={to - from} height={0.7} fill={fappyPalette.copingShade} />
      <rect
        x={from}
        y={cliffTop}
        width={to - from}
        height={COPING_DEPTH}
        fill={fappyPalette.coping}
        stroke={fappyPalette.ledgeEdge}
        strokeWidth={0.5}
      />
    </g>
  );
};

// A galvanised rooftop unit and a vent stack, back from the start roof's edge
// and behind where the bird stands, so nothing on the roof is in its way.
const RooftopPlant = ({ x }: { x: number }): JSX.Element => {
  const { cliffTop } = FAPPY_WORLD;
  const plantStroke = { stroke: fappyPalette.ledgeEdge, strokeWidth: 0.5 };

  return (
    <g>
      <rect x={x} y={cliffTop - 4.2} width={10} height={4.2} fill={fappyPalette.plant} {...plantStroke} />
      <path
        d={`M ${x + 1.2} ${cliffTop - 3.4} v 2.6 M ${x + 2.4} ${cliffTop - 3.4} v 2.6 M ${x + 3.6} ${cliffTop - 3.4} v 2.6`}
        stroke={fappyPalette.plantDark}
        strokeWidth={0.4}
      />
      <circle cx={x + 7} cy={cliffTop - 2.1} r={1.4} fill={fappyPalette.plantDark} />
      <rect x={x + 14} y={cliffTop - 5} width={1.4} height={5} fill={fappyPalette.plant} {...plantStroke} />
      <rect x={x + 13.4} y={cliffTop - 5.8} width={2.6} height={0.9} fill={fappyPalette.plantDark} />
    </g>
  );
};

// The two roofs a leg runs between: the red-brick block it takes off from,
// running off the left edge of the world, and the buff block at the far end
// it lands on, with the tall concrete tower past it that closes the sky. The
// faces are exactly the sim's: the start roof ends at `startCliffEnd`, the
// landing roof's face stands at the landing x and the tower's at the end of
// the plateau, all straight down. Coping along each roofline and windows
// down each face make them buildings; a gold dashed strip along the landing
// roof says where to come down, from the sofa as well as the tablet.
export const Cliffs = ({ gatesPerLeg }: { gatesPerLeg: number }): JSX.Element => {
  const { cliffTop, height, startCliffEnd, landingZoneWidth } = FAPPY_WORLD;
  const landingX = resolveFappyLandingX(gatesPerLeg);
  const wallX = landingX + landingZoneWidth;
  const faceStroke = { stroke: fappyPalette.ledgeEdge, strokeWidth: 0.8, strokeLinejoin: "round" as const };
  const faceHeight = height - cliffTop;
  const storeys = [cliffTop + 4.6, cliffTop + 10.6, cliffTop + 16.6];

  return (
    <g data-fappy-cliffs>
      <rect x={-CLIFF_OVERRUN} y={cliffTop} width={startCliffEnd + CLIFF_OVERRUN} height={faceHeight} fill={fappyPalette.brick} {...faceStroke} />
      <path d={resolveDarkBricks(0, startCliffEnd, cliffTop, faceHeight, 30)} fill={fappyPalette.brickDark} opacity={0.45} />
      <rect x={startCliffEnd - 1.6} y={cliffTop} width={1.2} height={faceHeight} fill={fappyPalette.brickLight} opacity={0.7} />
      <Windows grid={{ columns: resolveSpan(4, startCliffEnd - 8, 9), rows: storeys, width: 3.4, height: 4 }} />
      <Coping from={-CLIFF_OVERRUN} to={startCliffEnd + COPING_LIP} />
      <RooftopPlant x={6} />

      <rect x={landingX} y={cliffTop} width={landingZoneWidth} height={faceHeight} fill={fappyPalette.buff} {...faceStroke} />
      <path d={resolveDarkBricks(landingX, landingZoneWidth, cliffTop, faceHeight, 22)} fill={fappyPalette.buffDark} opacity={0.35} />
      <rect x={landingX + 0.4} y={cliffTop} width={1.2} height={faceHeight} fill={fappyPalette.buffLight} />
      <Windows grid={{ columns: resolveSpan(landingX + 5, wallX - 6, 9), rows: storeys, width: 3.4, height: 4 }} />
      <Coping from={landingX - COPING_LIP} to={wallX} />
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

      <rect
        x={wallX}
        y={-CLIFF_OVERRUN}
        width={CLIFF_OVERRUN}
        height={height + CLIFF_OVERRUN}
        fill={fappyPalette.tower}
        {...faceStroke}
        data-fappy-wall
      />
      {/* Ribbon glass floor by floor, the piers standing over it: an office tower, quiet enough
          that the two birds on the roof in front of it are what the room looks at. */}
      <path
        d={resolveSpan(2, height - 4, 6)
          .map((floor) => `M ${wallX + 3} ${floor} h 104 v 3 h -104 Z`)
          .join(" ")}
        fill={fappyPalette.towerGlass}
      />
      <path
        d={resolveSpan(wallX + 9, wallX + 105, 12)
          .map((pier) => `M ${pier} 0 h 1.8 v ${height} h -1.8 Z`)
          .join(" ")}
        fill={fappyPalette.towerLight}
      />
      <rect x={wallX} y={-CLIFF_OVERRUN} width={1.6} height={height + CLIFF_OVERRUN} fill={fappyPalette.towerDark} />
    </g>
  );
};

// A little pennant on the last leg's landing roof: nobody is waiting there,
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
