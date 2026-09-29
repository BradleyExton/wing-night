import type { QueensHotelPalette, SouldiersSkateShopPalette } from "@wingnight/scenery";
import { QUEENS_HOTEL, SOULDIERS_SKATE_SHOP, QueensHotel, SouldiersSkateShop } from "@wingnight/scenery";
import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { schlonicPalette } from "../palette.js";

// The two buildings the run goes between, stood in the zone itself rather than in a bank: the
// runner rolls out of Souldiers Skate Shop's door on the start line, and the post stands on the
// Queen's patio, under BAR. They scroll with the ground at full speed and stand on it, behind the
// sidewalk's lip and behind every piece of kit, so a badnik or a wing in front of either still
// wins — and they are the only buildings drawn at near scale and full strength, which is how the
// room knows the start and the finish before the strip says so.

/** How big each stands against its drawing at 1: a storey and a bit over a hen's height. */
export const SOULDIERS_SCALE = 0.8;
export const QUEENS_SCALE = 0.9;

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

/** Where the hotel stands so the middle of its patio is the post. */
export const resolveQueensX = (goalX: number): number => goalX - QUEENS_HOTEL.barX * QUEENS_SCALE;

/** Which leg of the street this zone is, so the shop stands on the first and the hotel on the last. */
export type SchlonicLeg = {
  index: number;
  count: number;
};

export const FIRST_LEG: SchlonicLeg = { index: 0, count: 1 };

// The street is one course; the shop is where it starts and the hotel is where it ends, so a
// middle leg has neither: its start line is the last rider's post and its post is the next
// rider's start line, on the same sidewalk.
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
    {leg.index >= leg.count - 1 && (
      <g data-schlonic-finish-hotel>
        <QueensHotel x={resolveQueensX(zone.goalX)} baseY={goalGroundY} palette={QUEENS} scale={QUEENS_SCALE} />
      </g>
    )}
  </g>
);
