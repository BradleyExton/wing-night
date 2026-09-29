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

export const SetPieces = ({ zone, goalGroundY }: { zone: SchlonicZone; goalGroundY: number }): JSX.Element => (
  <g data-schlonic-set-pieces>
    <g data-schlonic-start-shop>
      <SouldiersSkateShop
        x={resolveSouldiersX()}
        baseY={zone.heights[0] ?? SCHLONIC_WORLD.groundBaseY}
        palette={SOULDIERS}
        scale={SOULDIERS_SCALE}
      />
    </g>
    <g data-schlonic-finish-hotel>
      <QueensHotel x={resolveQueensX(zone.goalX)} baseY={goalGroundY} palette={QUEENS} scale={QUEENS_SCALE} />
    </g>
  </g>
);
