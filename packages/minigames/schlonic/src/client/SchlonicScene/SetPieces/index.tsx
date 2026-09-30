import type { CrossoversPalette, QueensHotelPalette, SouldiersSkateShopPalette } from "@wingnight/scenery";
import {
  QUEENS_HOTEL,
  SOULDIERS_SKATE_SHOP,
  Crossovers,
  QueensHotel,
  SouldiersSkateShop
} from "@wingnight/scenery";
import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import type { RunnerFigure } from "../../resolveRunnerFigure/index.js";
import { schlonicPalette } from "../palette.js";

// The two buildings the run goes between, stood in the zone itself rather than in a bank: the
// runner rolls out of Souldiers Skate Shop's door on the start line, and the post stands on the
// Queen's patio, under BAR. They scroll with the ground at full speed and stand on it, behind the
// sidewalk's lip and behind every piece of kit, so a goose or a wing in front of either still
// wins — and they are the only buildings drawn at near scale and full strength, which is how the
// room knows the start and the finish before the strip says so.

/** How big each stands against its drawing at 1: a storey and a bit over a hen's height. */
export const SOULDIERS_SCALE = 0.8;
export const QUEENS_SCALE = 0.9;
export const CROSSOVERS_SCALE = 0.8;
/** Where Crossover's pole sign stands inside its drawing, out from its left edge, at scale 1. */
const CROSSOVERS_SIGN_X = 10;

const SOULDIERS: SouldiersSkateShopPalette = {
  brick: schlonicPalette.brick,
  brickDark: schlonicPalette.brickDark,
  trim: schlonicPalette.trim,
  pane: schlonicPalette.pane,
  signGreen: schlonicPalette.signGreen,
  signGreenLight: schlonicPalette.signGreenLight,
  signInk: schlonicPalette.signInk,
  signLetter: schlonicPalette.signLetter
};

const QUEENS: QueensHotelPalette = {
  buff: schlonicPalette.buff,
  buffDark: schlonicPalette.buffDark,
  trim: schlonicPalette.trim,
  pane: schlonicPalette.pane,
  cornice: schlonicPalette.queensGreen,
  signLetter: schlonicPalette.signLetter,
  flag: schlonicPalette.flag
};

/** Where the shop stands so its door is on the start line, under the runner. */
export const resolveSouldiersX = (): number => SCHLONIC_WORLD.runnerX - SOULDIERS_SKATE_SHOP.doorX * SOULDIERS_SCALE;

// Crossover's at full strength: the set pieces' brick and glass, and its own sign paint.
const CROSSOVERS: CrossoversPalette = {
  brick: schlonicPalette.brick,
  brickDark: schlonicPalette.brickDark,
  trim: schlonicPalette.trim,
  pane: schlonicPalette.pane,
  signRed: schlonicPalette.crossoverRed,
  signYellow: schlonicPalette.crossoverYellow,
  signLetter: schlonicPalette.signLetter,
  signInk: schlonicPalette.crossoverInk,
  signBoard: schlonicPalette.crossoverBoard
};

/** Where the hotel stands so the middle of its patio is the post. */
export const resolveQueensX = (goalX: number): number => goalX - QUEENS_HOTEL.barX * QUEENS_SCALE;

/**
 * Where Crossover's stands so its pole sign is at `signX`. Its low brick box runs on from the
 * sign down the street, so a rider stood in front of the box keeps their name clear of the sign.
 */
export const resolveCrossoversX = (signX: number): number => signX - CROSSOVERS_SIGN_X * CROSSOVERS_SCALE;

/**
 * The sign stands this far short of a handoff post, so the post and the rider waiting past it
 * are both in front of the box and neither is under the sign.
 */
const SIGN_BEFORE_POST = 8;
/**
 * On the leg after, the sign stands this far in from the start of the ground, so it is in the
 * opening picture rather than off its left edge.
 */
const SIGN_AT_START = 6;

/**
 * Which leg of the street this zone is, so the shop stands on the first and the hotel on the
 * last, and who is either side of it in the relay: the rider who brought it here (`last`) and the
 * one it goes to next (`next`). Either is absent on the leg with no one there.
 */
export type SchlonicLeg = {
  index: number;
  count: number;
  last?: RunnerFigure | null;
  next?: RunnerFigure | null;
};

/** A relay leg has a handoff at one end or both; a street of one leg has none. */
export const isRelayLeg = (leg: SchlonicLeg): boolean => leg.count > 1;

export const FIRST_LEG: SchlonicLeg = { index: 0, count: 1 };

// The street is one course; the shop is where it starts and the hotel is where it ends. Every
// handoff between is at Crossover's, brought over from across the road: a leg's post stands just
// past its pole sign, and the leg after opens on the same sign behind the line — the same spot on
// the same sidewalk, where the next rider was waiting.
export const SetPieces = ({
  zone,
  goalGroundY,
  leg = FIRST_LEG
}: {
  zone: SchlonicZone;
  goalGroundY: number;
  leg?: SchlonicLeg;
}): JSX.Element => (
  <g data-schlonic-set-pieces>
    {leg.index === 0 && (
      <g data-schlonic-start-shop>
        <SouldiersSkateShop
          x={resolveSouldiersX()}
          baseY={zone.heights[0] ?? SCHLONIC_WORLD.groundBaseY}
          palette={SOULDIERS}
          scale={SOULDIERS_SCALE}
        />
      </g>
    )}
    {leg.index > 0 && (
      <g data-schlonic-handoff-start>
        <Crossovers x={resolveCrossoversX(SIGN_AT_START)} baseY={zone.heights[0] ?? SCHLONIC_WORLD.groundBaseY} palette={CROSSOVERS} scale={CROSSOVERS_SCALE} />
      </g>
    )}
    {leg.index < leg.count - 1 && (
      <g data-schlonic-handoff-post>
        <Crossovers x={resolveCrossoversX(zone.goalX - SIGN_BEFORE_POST)} baseY={goalGroundY} palette={CROSSOVERS} scale={CROSSOVERS_SCALE} />
      </g>
    )}
    {leg.index >= leg.count - 1 && (
      <g data-schlonic-finish-hotel>
        <QueensHotel x={resolveQueensX(zone.goalX)} baseY={goalGroundY} palette={QUEENS} scale={QUEENS_SCALE} />
      </g>
    )}
  </g>
);
