import { forwardRef, useImperativeHandle, useRef } from "react";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { schlonicPalette } from "../palette.js";

/**
 * What the zone looks out over: Kempenfelt Bay on a summer morning, from the south shore, facing
 * east into the sun the way the whole city does. Four banks, each scrolling at its own share of
 * the zone, so the room reads speed off the distance as well as off the ground:
 *
 *   clouds          the sky, barely moving
 *   far shore       Oro's treeline across the water
 *   town            downtown's towers, City Hall and a spire at the west end
 *   waterfront      the near strip: the Spirit Catcher, the marina, Allandale Station
 *
 * Nothing here is a surface the runner can touch, and nothing here is the cast — the three
 * readings of the schlong (§2.11) are the only things in the zone that mean anything, so the
 * whole backdrop is hazed, flat and quiet enough that a pink one with a face still wins the eye.
 */
export const CLOUD_PARALLAX = 0.05;
export const FAR_SHORE_PARALLAX = 0.1;
export const TOWN_PARALLAX = 0.2;
export const WATERFRONT_PARALLAX = 0.34;

export type BackdropRefs = {
  clouds: SVGGElement | null;
  farShore: SVGGElement | null;
  town: SVGGElement | null;
  waterfront: SVGGElement | null;
};

/** Where the far bank meets the water, where the water meets the beach, where the beach gives up. */
const HORIZON_Y = 42;
const SHORE_Y = 58;
const BEACH_Y = 62;

/** The sun is low and east, down the length of the bay, and the water carries its column. */
const SUN_X = 116;
const SUN_Y = 26;

/**
 * How wide a bank has to be so it never runs out before the zone does: the screen, plus the
 * distance this bank travels over the whole run, plus a margin for the first screen's worth of
 * scenery sitting left of the start line.
 */
const bandWidth = (zoneLength: number, parallax: number): number => {
  return SCHLONIC_WORLD.width * 1.5 + Math.max(0, zoneLength) * parallax;
};

/** Where each repeat of a bank's scenery stands, laid out left of the start line and on. */
const standsAt = (width: number, spacing: number): number[] => {
  const count = Math.ceil(width / spacing) + 1;

  return Array.from({ length: count }, (_unused, index) => index * spacing - spacing * 0.5);
};

/** A smooth bank of land, continuous from one hump into the next, filled down past its base. */
const ridgeBand = (width: number, humpWidth: number, humpHeight: number, baseY: number): string => {
  const humps = Math.ceil(width / humpWidth) + 2;
  const shares = [1, 0.58, 0.82, 0.44];
  const path = [`M ${-humpWidth} ${baseY}`];

  for (let hump = 0; hump < humps; hump += 1) {
    const left = -humpWidth + hump * humpWidth;
    const rise = humpHeight * (shares[hump % shares.length] ?? 1);

    path.push(`Q ${left + humpWidth / 2} ${baseY - rise} ${left + humpWidth} ${baseY}`);
  }

  return `${path.join(" ")} L ${width} ${baseY + 6} L ${-humpWidth} ${baseY + 6} Z`;
};

/** The conifers on it, as one sawtooth run: at this distance a treeline is a texture, not trees. */
const treeBand = (width: number, baseY: number): string => {
  const step = 2.6;
  const heights = [2.6, 1.7, 3.3, 2.1, 2.9, 1.5];
  const path = [`M ${-step} ${baseY}`];

  for (let tree = 0; tree * step < width + step * 2; tree += 1) {
    const left = -step + tree * step;
    const height = heights[tree % heights.length] ?? 2;

    path.push(`L ${left + step / 2} ${baseY - height} L ${left + step} ${baseY}`);
  }

  return `${path.join(" ")} L ${width} ${baseY + 3} L ${-step} ${baseY + 3} Z`;
};

/** A slab of windows, cheap: two columns of lit floors rather than a grid of rectangles. */
const TowerWindows = ({
  x,
  y,
  width,
  height
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}): JSX.Element => (
  <g fill={schlonicPalette.townGlass} opacity={0.5}>
    {Array.from({ length: Math.max(1, Math.floor(height / 3)) }, (_unused, floor) => (
      <rect key={floor} x={x + 0.8} y={y + 1.6 + floor * 3} width={width - 1.6} height={1.2} />
    ))}
  </g>
);

/**
 * Downtown across the west end of the bay: the waterfront slabs, the stepped block of City Hall
 * and a spire behind them. Hazed to one blue, because it is a skyline, not a level.
 */
const TownCluster = ({ x, baseY }: { x: number; baseY: number }): JSX.Element => {
  const towers = [
    { offset: 0, width: 5, height: 15 },
    { offset: 6.5, width: 4.5, height: 21 },
    { offset: 12, width: 6, height: 12 }
  ];

  return (
    <g>
      {/* A church spire, furthest back and palest. */}
      <g fill={schlonicPalette.town} opacity={0.55}>
        <rect x={x + 33} y={baseY - 11} width={3.4} height={11} />
        <path d={`M ${x + 32.2} ${baseY - 11} L ${x + 34.7} ${baseY - 19} L ${x + 37.2} ${baseY - 11} Z`} />
      </g>
      {towers.map((tower) => (
        <g key={tower.offset}>
          <rect
            x={x + tower.offset}
            y={baseY - tower.height}
            width={tower.width}
            height={tower.height}
            fill={schlonicPalette.town}
          />
          <rect
            x={x + tower.offset}
            y={baseY - tower.height}
            width={1.2}
            height={tower.height}
            fill={schlonicPalette.townDark}
            opacity={0.6}
          />
          <TowerWindows
            x={x + tower.offset}
            y={baseY - tower.height}
            width={tower.width}
            height={tower.height}
          />
        </g>
      ))}
      {/* City Hall: a long block that steps up once, which is how the room knows it from a condo. */}
      <g>
        <rect x={x + 19} y={baseY - 7} width={13} height={7} fill={schlonicPalette.town} />
        <rect x={x + 19} y={baseY - 11.5} width={5.5} height={4.5} fill={schlonicPalette.town} />
        <rect x={x + 19} y={baseY - 11.5} width={5.5} height={1} fill={schlonicPalette.townDark} />
        <TowerWindows x={x + 19} y={baseY - 7} width={13} height={7} />
      </g>
    </g>
  );
};

/**
 * The Spirit Catcher: the steel bird on the waterfront, one wing up off its mast. Drawn as solid
 * sweeps and nothing finer — notched feathers and thin arms turn into an aerial at the size this
 * sits on a TV, and the city did not put an aerial on the shore. It put a giant bird there
 * decades before this game put a small one on it, which is the joke nobody from here needs told.
 */
const SpiritCatcher = ({ x, baseY }: { x: number; baseY: number }): JSX.Element => {
  const mastHeight = 16;
  const pivotY = baseY - mastHeight;

  return (
    <g data-schlonic-spirit-catcher>
      <rect x={x - 3.6} y={baseY - 1.8} width={7.2} height={2} fill={schlonicPalette.steelDark} />
      <path
        d={`M ${x - 1.5} ${baseY - 1.6} L ${x + 1.5} ${baseY - 1.6} L ${x + 0.7} ${pivotY} L ${x - 0.7} ${pivotY} Z`}
        fill={schlonicPalette.steel}
        stroke={schlonicPalette.steelDark}
        strokeWidth={0.3}
        strokeLinejoin="round"
      />
      <g fill={schlonicPalette.steel} stroke={schlonicPalette.steelDark} strokeWidth={0.35} strokeLinejoin="round">
        {/* The wing, swept up and back over the water. */}
        <path
          d={`M ${x - 0.6} ${pivotY + 4} C ${x - 6} ${pivotY + 1} ${x - 11.5} ${pivotY - 6} ${x - 10} ${pivotY - 15} C ${x - 7} ${pivotY - 9.5} ${x - 3} ${pivotY - 5} ${x + 1.2} ${pivotY - 1} Z`}
        />
        {/* The tail, low on the other side. */}
        <path d={`M ${x + 0.6} ${pivotY + 0.6} L ${x + 8.5} ${pivotY + 6.5} L ${x + 7} ${pivotY + 2.4} Z`} />
        {/* The head, turned back down the bay. */}
        <circle cx={x - 0.6} cy={pivotY - 2.2} r={1.6} />
        <path d={`M ${x - 1.8} ${pivotY - 2.8} L ${x - 5.4} ${pivotY - 3.6} L ${x - 1.8} ${pivotY - 1.6} Z`} />
      </g>
      {/* One seam down the wing: enough to say plates, not enough to break the silhouette. */}
      <path
        d={`M ${x - 1.4} ${pivotY + 2.6} C ${x - 5} ${pivotY - 1} ${x - 8.4} ${pivotY - 6} ${x - 9.2} ${pivotY - 13}`}
        fill="none"
        stroke={schlonicPalette.steelDark}
        strokeWidth={0.35}
        opacity={0.55}
      />
    </g>
  );
};

/**
 * Allandale Station: the old brick stop on the water, gable and canopy, still standing at the
 * bottom of the hill it always stood at.
 */
const AllandaleStation = ({ x, baseY }: { x: number; baseY: number }): JSX.Element => {
  const width = 25;
  const height = 8.5;

  return (
    <g data-schlonic-station>
      <rect x={x - 2} y={baseY - 0.6} width={width + 4} height={1.4} fill={schlonicPalette.dockDark} />
      <rect x={x} y={baseY - height} width={width} height={height} fill={schlonicPalette.brick} />
      <rect x={x} y={baseY - height} width={width} height={1} fill={schlonicPalette.brickDark} opacity={0.5} />
      {/* Hipped roof over the length, and the centre gable the platform side is known by. */}
      <path
        d={`M ${x - 2.2} ${baseY - height} L ${x + 4} ${baseY - height - 3.4} L ${x + width - 4} ${baseY - height - 3.4} L ${x + width + 2.2} ${baseY - height} Z`}
        fill={schlonicPalette.roof}
      />
      <path
        d={`M ${x + width / 2 - 4.4} ${baseY - height - 1.4} L ${x + width / 2} ${baseY - height - 5.6} L ${x + width / 2 + 4.4} ${baseY - height - 1.4} Z`}
        fill={schlonicPalette.roof}
      />
      <circle cx={x + width / 2} cy={baseY - height - 2.6} r={0.9} fill={schlonicPalette.townGlass} />
      {[3, 8, 13, 18].map((offset) => (
        <rect
          key={offset}
          x={x + offset}
          y={baseY - height + 2.4}
          width={2.6}
          height={4.4}
          rx={1.3}
          fill={schlonicPalette.townGlass}
          opacity={0.75}
        />
      ))}
      {/* The platform canopy, on its posts. */}
      <rect x={x - 3.4} y={baseY - 4.6} width={width + 7} height={0.9} fill={schlonicPalette.roof} />
      {[-2.4, width / 2, width + 2.4].map((offset) => (
        <rect key={offset} x={x + offset} y={baseY - 4.6} width={0.7} height={4} fill={schlonicPalette.roof} />
      ))}
    </g>
  );
};

/** One boat on the bay: hull, mast, main and jib. The marina keeps a few hundred of these. */
const Sailboat = ({ x, waterY, scale }: { x: number; waterY: number; scale: number }): JSX.Element => (
  <g transform={`translate(${x} ${waterY}) scale(${scale})`}>
    <path d="M -3.2 0 L 3.2 0 L 2.1 1.5 L -2.1 1.5 Z" fill={schlonicPalette.hull} />
    <rect x={-0.18} y={-7.2} width={0.36} height={7.2} fill={schlonicPalette.steelDark} />
    <path d="M 0.4 -6.9 L 3.6 -0.4 L 0.4 -0.4 Z" fill={schlonicPalette.sail} />
    <path d="M -0.4 -5.6 L -2.7 -0.4 L -0.4 -0.4 Z" fill={schlonicPalette.sail} opacity={0.88} />
  </g>
);

/** The marina: a finger of dock on its pilings, with two boats tied off it. */
const Marina = ({ x, baseY }: { x: number; baseY: number }): JSX.Element => (
  <g data-schlonic-marina>
    <rect x={x} y={baseY - 2.6} width={24} height={1.3} fill={schlonicPalette.dock} />
    {[1, 8, 15, 22].map((offset) => (
      <rect key={offset} x={x + offset} y={baseY - 1.4} width={0.9} height={2.6} fill={schlonicPalette.dockDark} />
    ))}
    <Sailboat x={x + 6} waterY={baseY - 3.4} scale={0.85} />
    <Sailboat x={x + 18} waterY={baseY - 2.2} scale={1} />
  </g>
);

export const Backdrop = forwardRef<BackdropRefs, { zoneLength: number }>(
  ({ zoneLength }, ref): JSX.Element => {
    const clouds = useRef<SVGGElement>(null);
    const farShore = useRef<SVGGElement>(null);
    const town = useRef<SVGGElement>(null);
    const waterfront = useRef<SVGGElement>(null);

    useImperativeHandle(ref, () => ({
      clouds: clouds.current,
      farShore: farShore.current,
      town: town.current,
      waterfront: waterfront.current
    }));

    const shoreWidth = bandWidth(zoneLength, FAR_SHORE_PARALLAX);
    const townWidth = bandWidth(zoneLength, TOWN_PARALLAX);
    const waterfrontWidth = bandWidth(zoneLength, WATERFRONT_PARALLAX);

    return (
      <g data-schlonic-backdrop>
        <circle cx={SUN_X} cy={SUN_Y} r={13} fill={schlonicPalette.sun} opacity={0.18} />
        <circle cx={SUN_X} cy={SUN_Y} r={7.5} fill={schlonicPalette.sun} opacity={0.95} />
        <g ref={clouds}>
          {[14, 62, 108, 158, 206, 252].map((x, index) => (
            <g key={x} opacity={0.85}>
              <ellipse cx={x} cy={12 + (index % 3) * 5} rx={9} ry={3.4} fill={schlonicPalette.cloud} />
              <ellipse cx={x + 6} cy={10 + (index % 3) * 5} rx={6} ry={3} fill={schlonicPalette.cloud} />
            </g>
          ))}
          {/* Gulls. There is no waterfront in this city without them. */}
          {[46, 132, 214].map((x, index) => (
            <path
              key={x}
              d={`M ${x} ${21 + index * 4} q 1.6 -1.4 3.2 0 q 1.6 -1.4 3.2 0`}
              fill="none"
              stroke={schlonicPalette.steelDark}
              strokeWidth={0.4}
              strokeLinecap="round"
              opacity={0.5}
            />
          ))}
        </g>
        <g ref={farShore}>
          <path d={ridgeBand(shoreWidth, 74, 9, HORIZON_Y)} fill={schlonicPalette.shoreFar} opacity={0.85} />
          <path d={treeBand(shoreWidth, HORIZON_Y)} fill={schlonicPalette.shoreFarTrees} opacity={0.75} />
        </g>
        {/* The bay itself: deep down the middle, bright where it shallows into the near shore. */}
        <rect x={0} y={HORIZON_Y} width={SCHLONIC_WORLD.width} height={SHORE_Y - HORIZON_Y} fill={schlonicPalette.bay} />
        <rect x={0} y={HORIZON_Y} width={SCHLONIC_WORLD.width} height={4} fill={schlonicPalette.bayFar} />
        <rect x={0} y={SHORE_Y - 4} width={SCHLONIC_WORLD.width} height={4} fill={schlonicPalette.bayNear} opacity={0.75} />
        {/* The sun's column, widening as it comes at you. */}
        <g fill={schlonicPalette.bayGlitter}>
          {Array.from({ length: 8 }, (_unused, row) => {
            const y = HORIZON_Y + 2.4 + row * 1.9;
            const spread = 1.6 + row * 1.7;
            // Broken into dashes: a solid bar per row reads as a ladder, not as light on water.
            const dashes = [-0.72, -0.24, 0.3, 0.78];

            return dashes.map((share, dash) => (
              <rect
                key={`${row}-${dash}`}
                x={SUN_X + spread * share}
                y={y}
                width={1.4 + (dash % 2) * 1.3}
                height={0.55}
                opacity={0.5 - row * 0.045}
              />
            ));
          })}
        </g>
        <g ref={town}>
          {standsAt(townWidth, 128).map((x) => (
            <TownCluster key={x} x={x} baseY={HORIZON_Y + 1} />
          ))}
        </g>
        {/* The near shore: beach, then the park the zone is cut out of. */}
        <rect x={0} y={SHORE_Y} width={SCHLONIC_WORLD.width} height={BEACH_Y - SHORE_Y} fill={schlonicPalette.beach} />
        <rect x={0} y={SHORE_Y} width={SCHLONIC_WORLD.width} height={1} fill={schlonicPalette.beachDark} opacity={0.7} />
        <rect
          x={0}
          y={BEACH_Y}
          width={SCHLONIC_WORLD.width}
          height={SCHLONIC_WORLD.height - BEACH_Y}
          fill={schlonicPalette.park}
        />
        <g ref={waterfront}>
          {standsAt(waterfrontWidth, 186).map((x) => (
            <g key={x}>
              <Marina x={x + 4} baseY={SHORE_Y} />
              <SpiritCatcher x={x + 62} baseY={BEACH_Y + 1} />
              <AllandaleStation x={x + 108} baseY={BEACH_Y + 1} />
            </g>
          ))}
        </g>
      </g>
    );
  }
);

Backdrop.displayName = "Backdrop";
