import { forwardRef, useImperativeHandle, useRef } from "react";
import { CROSSOVERS, Crossovers, STOREFRONTS, Storefronts, TownCluster, WaterfrontCondos } from "@wingnight/scenery";
import type { CrossoversPalette, StorefrontsPalette, TownClusterPalette, WaterfrontCondosPalette } from "@wingnight/scenery";

import type { SchlonicCamera } from "../camera/index.js";
import { schlonicPalette } from "../palette.js";

/**
 * The city in the zone's own morning haze. The landmarks are drawn by `@wingnight/scenery`,
 * which carries no colour of its own — JOUST stands the same shapes at dusk (DESIGN.md §2.7) —
 * so this is where the zone's palette (§2.11) names what each one is made of. Everything past the
 * kerb is mixed toward the sky, so the kit in front of it wins.
 */
const TOWN: TownClusterPalette & WaterfrontCondosPalette = {
  wall: schlonicPalette.town,
  wallDark: schlonicPalette.townDark,
  glass: schlonicPalette.townGlass,
  tower: schlonicPalette.condo,
  towerDark: schlonicPalette.condoDark,
  towerGlass: schlonicPalette.condoGlass,
  roof: schlonicPalette.condoRoof
};

const STREET: StorefrontsPalette = {
  brick: schlonicPalette.streetBrick,
  brickDark: schlonicPalette.streetBrickDark,
  buff: schlonicPalette.streetBuff,
  buffDark: schlonicPalette.streetBuffDark,
  trim: schlonicPalette.streetTrim,
  pane: schlonicPalette.streetPane,
  awning: schlonicPalette.streetAwning,
  cornice: schlonicPalette.streetCornice
};

const CROSSOVERS_PAINT: CrossoversPalette = {
  brick: schlonicPalette.streetBrick,
  brickDark: schlonicPalette.streetBrickDark,
  trim: schlonicPalette.streetTrim,
  pane: schlonicPalette.streetPane,
  signRed: schlonicPalette.crossoverRed,
  signYellow: schlonicPalette.crossoverYellow,
  signLetter: schlonicPalette.signLetter,
  signInk: schlonicPalette.crossoverInk,
  signBoard: schlonicPalette.crossoverBoard
};

/**
 * What the zone looks out over: Dunlop Street on a summer morning, seen from the sidewalk the
 * runner skates, with the bay at the bottom of the hill the way downtown always has it. Five
 * banks, each scrolling at its own share of the zone, so the room reads speed off the distance
 * as well as off the ground:
 *
 *   clouds          the sky and its gulls, barely moving
 *   far shore       Oro's treeline across the water
 *   town            downtown's slabs, City Hall, the spire and the twin condos on the water
 *   street          Dunlop's fronts across the road, with Crossover's once, mid-zone
 *   road            the centre line of the road between the two sidewalks
 *
 * The sky, the water, the far sidewalk and the asphalt are still bands; the buildings standing
 * on them come from `@wingnight/scenery`. The two set pieces the run starts and ends at —
 * Souldiers and the Queen's — are not back here: they stand in the zone itself (`SetPieces`).
 *
 * Nothing here is a surface the runner can touch, and nothing here is the cast — the three
 * readings of the schlong (§2.11) are the only things in the zone that mean anything, so the
 * whole backdrop is hazed, flat and quiet enough that a pink one with a face still wins the eye.
 */
export const CLOUD_PARALLAX = 0.05;
export const FAR_SHORE_PARALLAX = 0.1;
export const TOWN_PARALLAX = 0.2;
export const STREET_PARALLAX = 0.34;
export const ROAD_PARALLAX = 0.7;

/** Slides every bank by its own share of how far the zone has scrolled: the parallax, per frame. */
export const paintBackdropScroll = (refs: BackdropRefs | null, scrollX: number): void => {
  const banks: [SVGGElement | null | undefined, number][] = [
    [refs?.clouds, CLOUD_PARALLAX],
    [refs?.farShore, FAR_SHORE_PARALLAX],
    [refs?.town, TOWN_PARALLAX],
    [refs?.street, STREET_PARALLAX],
    [refs?.road, ROAD_PARALLAX]
  ];

  for (const [bank, parallax] of banks) {
    bank?.setAttribute("transform", `translate(${-scrollX * parallax} 0)`);
  }
};

/** The town across the bay's near edge is a skyline, so it gets the most haze. */
const TOWN_HAZE = 0.82;

export type BackdropRefs = {
  clouds: SVGGElement | null;
  farShore: SVGGElement | null;
  town: SVGGElement | null;
  street: SVGGElement | null;
  road: SVGGElement | null;
};

/** Where Oro's far bank meets the water, and where the water meets downtown's own shore. */
const HORIZON_Y = 40;
const BAY_EDGE_Y = 48;
/** Where the fronts across the road stand, and where the road itself begins. */
const FAR_KERB_Y = 60;
const ROAD_Y = 61.6;
/** The road's centre line, just clear of the near sidewalk's lip on the flat. */
const LANE_Y = 62.7;

/** The sun is low and east, over the bay, and the water carries a short column of it. */
const SUN_X = 116;
const SUN_Y = 24;

/** How big the fronts across the road stand, against their drawing at 1. */
const STOREFRONT_SCALE = 0.78;
const CROSSOVERS_SCALE = 0.56;
const CONDOS_SCALE = 0.5;
/** Where Crossover's stands: this far across the camera when the runner is this share of the way. */
const CROSSOVERS_SCREEN_X = 96;
const CROSSOVERS_AT = 0.4;

/**
 * How wide a bank has to be so it never runs out before the zone does: the camera, plus the
 * distance this bank travels over the whole run, plus a margin for the first screen's worth of
 * scenery sitting left of the start line.
 */
const bandWidth = (zoneLength: number, parallax: number, cameraWidth: number): number => {
  return cameraWidth * 1.5 + Math.max(0, zoneLength) * parallax;
};

/**
 * The still bands never scroll, so they only have to cover the camera — with a margin either
 * side, because a filling camera is re-measured a frame after the box changes.
 */
const STILL_BAND_MARGIN = 40;

/** Where each repeat of a bank's scenery stands, laid out left of the start line and on. */
const standsAt = (width: number, spacing: number): number[] => {
  const count = Math.ceil(width / spacing) + 1;

  return Array.from({ length: count }, (_unused, index) => index * spacing - spacing * 0.5);
};

/**
 * Where a bank has to put something for it to stand at `screenX` on the camera the moment the
 * runner is `runnerDistance` into the zone: a bank at `parallax` has slid that share of it left.
 */
const bankXFor = (screenX: number, runnerDistance: number, parallax: number): number => {
  return screenX + runnerDistance * parallax;
};

type StreetRun = { x: number; count: number; seed: number };

/**
 * The fronts across the road, as runs of two to four with a cross street between each: the gaps
 * are where the bay shows at the bottom of the hill, which is how a side view says "downtown on
 * the water". Laid by a fixed rhythm, never at random, so both screens agree; a run that would
 * stand in front of Crossover's lot stops short of it, and the street picks up again past it.
 */
const streetRuns = (width: number, keepClear: { from: number; to: number }): StreetRun[] => {
  const counts = [4, 3, 4, 2, 3];
  const gaps = [13, 19, 11, 22, 16];
  const frontWidth = STOREFRONTS.frontWidth * STOREFRONT_SCALE;
  const runs: StreetRun[] = [];
  let x = -60;

  for (let run = 0; x < width; run += 1) {
    const gap = gaps[run % gaps.length] ?? 16;
    const count = counts[run % counts.length] ?? 3;

    if (x < keepClear.to && x + count * frontWidth > keepClear.from) {
      const fits = Math.floor((keepClear.from - x) / frontWidth);

      if (fits > 0) {
        runs.push({ x, count: fits, seed: run });
      }

      x = Math.max(x, keepClear.to) + gap * 0.5;
      continue;
    }

    runs.push({ x, count, seed: run });
    x += count * frontWidth + gap;
  }

  return runs;
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

export const Backdrop = forwardRef<BackdropRefs, { zoneLength: number; camera: SchlonicCamera }>(
  ({ zoneLength, camera }, ref): JSX.Element => {
    const clouds = useRef<SVGGElement>(null);
    const farShore = useRef<SVGGElement>(null);
    const town = useRef<SVGGElement>(null);
    const street = useRef<SVGGElement>(null);
    const road = useRef<SVGGElement>(null);

    useImperativeHandle(ref, () => ({
      clouds: clouds.current,
      farShore: farShore.current,
      town: town.current,
      street: street.current,
      road: road.current
    }));

    const shoreWidth = bandWidth(zoneLength, FAR_SHORE_PARALLAX, camera.width);
    const townWidth = bandWidth(zoneLength, TOWN_PARALLAX, camera.width);
    const streetWidth = bandWidth(zoneLength, STREET_PARALLAX, camera.width);
    const roadWidth = bandWidth(zoneLength, ROAD_PARALLAX, camera.width);
    const stillX = camera.x - STILL_BAND_MARGIN;
    const stillWidth = camera.width + STILL_BAND_MARGIN * 2;
    const floorY = camera.y + camera.height;
    // Crossover's stands once, ahead of the runner a little before the middle of the zone, so it
    // has gone off the back of the picture before the Queen's comes up at the end.
    const crossoversWidth = CROSSOVERS.width * CROSSOVERS_SCALE;
    const crossoversX = bankXFor(CROSSOVERS_SCREEN_X, zoneLength * CROSSOVERS_AT, STREET_PARALLAX) - crossoversWidth / 2;
    const runs = streetRuns(streetWidth, { from: crossoversX - 4, to: crossoversX + crossoversWidth + 2 });

    return (
      <g data-schlonic-backdrop>
        <circle cx={SUN_X} cy={SUN_Y} r={13} fill={schlonicPalette.sun} opacity={0.18} />
        <circle cx={SUN_X} cy={SUN_Y} r={7.5} fill={schlonicPalette.sun} opacity={0.95} />
        <g ref={clouds} data-schlonic-bank="clouds" data-schlonic-parallax={CLOUD_PARALLAX}>
          {[14, 62, 108, 158, 206, 252].map((x, index) => (
            <g key={x} opacity={0.85}>
              <ellipse cx={x} cy={10 + (index % 3) * 5} rx={9} ry={3.4} fill={schlonicPalette.cloud} />
              <ellipse cx={x + 6} cy={8 + (index % 3) * 5} rx={6} ry={3} fill={schlonicPalette.cloud} />
            </g>
          ))}
          {/* Gulls. They come up off the bay and work the whole of downtown. */}
          {[46, 132, 214].map((x, index) => (
            <path
              key={x}
              d={`M ${x} ${19 + index * 4} q 1.6 -1.4 3.2 0 q 1.6 -1.4 3.2 0`}
              fill="none"
              stroke={schlonicPalette.skyInk}
              strokeWidth={0.4}
              strokeLinecap="round"
              opacity={0.5}
            />
          ))}
        </g>
        <g ref={farShore} data-schlonic-bank="far-shore" data-schlonic-parallax={FAR_SHORE_PARALLAX}>
          <path d={ridgeBand(shoreWidth, 74, 6, HORIZON_Y)} fill={schlonicPalette.shoreFar} opacity={0.85} />
          <path d={treeBand(shoreWidth, HORIZON_Y)} fill={schlonicPalette.shoreFarTrees} opacity={0.75} />
        </g>
        {/* The bay at the bottom of the hill: deep at the horizon, bright where it meets the town. */}
        <rect x={stillX} y={HORIZON_Y} width={stillWidth} height={BAY_EDGE_Y - HORIZON_Y} fill={schlonicPalette.bay} />
        <rect x={stillX} y={HORIZON_Y} width={stillWidth} height={2} fill={schlonicPalette.bayFar} />
        <rect x={stillX} y={BAY_EDGE_Y - 2.5} width={stillWidth} height={2.5} fill={schlonicPalette.bayNear} opacity={0.75} />
        {/* The sun's column, widening as it comes at you. */}
        <g fill={schlonicPalette.bayGlitter}>
          {Array.from({ length: 4 }, (_unused, row) => {
            const y = HORIZON_Y + 1.8 + row * 1.6;
            const spread = 1.6 + row * 1.9;
            // Broken into dashes: a solid bar per row reads as a ladder, not as light on water.
            const dashes = [-0.72, -0.24, 0.3, 0.78];

            return dashes.map((share, dash) => (
              <rect
                key={`${row}-${dash}`}
                x={SUN_X + spread * share}
                y={y}
                width={1.4 + (dash % 2) * 1.3}
                height={0.5}
                opacity={0.5 - row * 0.08}
              />
            ));
          })}
        </g>
        {/* Downtown's own slope down to the water, under the town and behind the fronts. */}
        <rect x={stillX} y={BAY_EDGE_Y} width={stillWidth} height={FAR_KERB_Y - BAY_EDGE_Y} fill={schlonicPalette.hillside} />
        <g ref={town} data-schlonic-bank="town" data-schlonic-parallax={TOWN_PARALLAX} opacity={TOWN_HAZE}>
          {/* The condos stand with every other cluster: one pair of towers is the landmark, and
              two pairs on one screen read as four. */}
          {standsAt(townWidth, 128).map((x, index) => (
            <g key={x}>
              <TownCluster x={x} baseY={BAY_EDGE_Y + 0.5} palette={TOWN} />
              {index % 2 === 1 && (
                <WaterfrontCondos x={x + 62} baseY={BAY_EDGE_Y + 0.5} palette={TOWN} scale={CONDOS_SCALE} />
              )}
            </g>
          ))}
        </g>
        {/* The far sidewalk the fronts stand on, then the road between it and the runner's own. */}
        <rect x={stillX} y={FAR_KERB_Y} width={stillWidth} height={ROAD_Y - FAR_KERB_Y} fill={schlonicPalette.farSidewalk} />
        <rect x={stillX} y={ROAD_Y} width={stillWidth} height={floorY - ROAD_Y} fill={schlonicPalette.asphalt} />
        <rect x={stillX} y={ROAD_Y} width={stillWidth} height={0.5} fill={schlonicPalette.curbShadow} opacity={0.6} />
        <g ref={street} data-schlonic-bank="street" data-schlonic-parallax={STREET_PARALLAX}>
          {runs.map((run) => (
            <Storefronts
              key={run.x}
              x={run.x}
              baseY={FAR_KERB_Y + 0.4}
              palette={STREET}
              seed={run.seed}
              count={run.count}
              scale={STOREFRONT_SCALE}
            />
          ))}
          <g data-schlonic-crossovers>
            <Crossovers x={crossoversX} baseY={FAR_KERB_Y + 0.4} palette={CROSSOVERS_PAINT} scale={CROSSOVERS_SCALE} />
          </g>
        </g>
        <g ref={road} data-schlonic-bank="road" data-schlonic-parallax={ROAD_PARALLAX} fill={schlonicPalette.laneLine}>
          {Array.from({ length: Math.ceil(roadWidth / 9) + 2 }, (_unused, dash) => (
            <rect key={dash} x={-9 + dash * 9} y={LANE_Y} width={4.6} height={0.55} opacity={0.85} />
          ))}
        </g>
      </g>
    );
  }
);

Backdrop.displayName = "Backdrop";
