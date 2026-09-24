import { forwardRef, useImperativeHandle, useRef } from "react";
import { AllandaleStation, Marina, SpiritCatcher, TownCluster } from "@wingnight/scenery";
import type { SceneryPalette } from "@wingnight/scenery";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { schlonicPalette } from "../palette.js";

/**
 * The landmarks in the zone's own morning haze. They are drawn by `@wingnight/scenery`, which
 * carries no colour of its own — JOUST stands the same shapes at dusk (DESIGN.md §2.7) — so this
 * is where the zone's palette (§2.11) names each material the waterfront is made of.
 */
const SCENERY: SceneryPalette = {
  steel: schlonicPalette.steel,
  steelDark: schlonicPalette.steelDark,
  mound: schlonicPalette.turfDark,
  wall: schlonicPalette.town,
  wallDark: schlonicPalette.townDark,
  glass: schlonicPalette.townGlass,
  brick: schlonicPalette.brick,
  brickDark: schlonicPalette.brickDark,
  roof: schlonicPalette.roof,
  platform: schlonicPalette.dockDark,
  dock: schlonicPalette.dock,
  dockDark: schlonicPalette.dockDark,
  hull: schlonicPalette.hull,
  mast: schlonicPalette.steelDark,
  sail: schlonicPalette.sail
};

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
 * The sky, the water and the land are here; the landmarks standing on them come from
 * `@wingnight/scenery`, because JOUST looks out over the same shore at dusk (§2.7) and the city
 * is drawn once — this file only says what colour the morning makes it.
 *
 * Nothing here is a surface the runner can touch, and nothing here is the cast — the three
 * readings of the schlong (§2.11) are the only things in the zone that mean anything, so the
 * whole backdrop is hazed, flat and quiet enough that a pink one with a face still wins the eye.
 */
export const CLOUD_PARALLAX = 0.05;
export const FAR_SHORE_PARALLAX = 0.1;
export const TOWN_PARALLAX = 0.2;
export const WATERFRONT_PARALLAX = 0.34;

/**
 * The near bank stands on the same strip of shore the zone's kit is dealt onto, in weathering
 * steel and station brick — the two darkest, warmest things in the picture, and the brick is
 * all but a wing's own hue. Hazed like the banks behind it, so a pink one with a face and an
 * orange wing still win the eye over a landmark at the same height.
 */
export const WATERFRONT_HAZE = 0.55;

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
            <TownCluster key={x} x={x} baseY={HORIZON_Y + 1} palette={SCENERY} />
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
        <g ref={waterfront} opacity={WATERFRONT_HAZE}>
          {standsAt(waterfrontWidth, 186).map((x) => (
            <g key={x}>
              <Marina x={x + 4} baseY={SHORE_Y} palette={SCENERY} />
              <SpiritCatcher x={x + 62} baseY={BEACH_Y + 1} palette={SCENERY} />
              <AllandaleStation x={x + 108} baseY={BEACH_Y + 1} palette={SCENERY} />
            </g>
          ))}
        </g>
      </g>
    );
  }
);

Backdrop.displayName = "Backdrop";
