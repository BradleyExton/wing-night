import type { SchlonicZone } from "@wingnight/shared";
import { resolveSchlonicGroundY } from "@wingnight/shared";

import { schlonicPalette } from "../../palette.js";

// The Dunlop Street dig, dressed round every hole in the zone: an orange-and-white barrel on each
// lip, and on the near one a sawhorse to say the sidewalk is closed — unless a piece of kit stands
// there (the finale's kicker does), because dressing never stands over kit. It is what turns a gap in
// the ground into a road-construction trench, and it is dressing, not kit — it stands on the back
// of the sidewalk, behind the lip the runner rides, and it never touches anything. It stands on
// solid ground either side of the trench and never over it, so nothing across the gap can read
// as a bridge.

const BARREL_WIDTH = 3.4;
const BARREL_HEIGHT = 5.2;
/** How far back from the edge of the hole each barrel stands, to its middle. */
const BARREL_SETBACK = 2.6;
const SAWHORSE_WIDTH = 6.4;
const SAWHORSE_HEIGHT = 4.4;
/** How far back from the near barrel's middle the sawhorse stands, to its middle. */
const SAWHORSE_SETBACK = 6.6;
/** How close to the sawhorse's middle a piece of kit may stand before the sawhorse stays away. */
const SAWHORSE_CLEARANCE = 10;

/** Whether any kit but a wing stands near `x`: wings hang in the air, everything else is at eye level. */
const isKitNear = (zone: SchlonicZone, x: number): boolean => {
  return zone.props.some((prop) => {
    return prop.kind !== "wing" && x > prop.x - SAWHORSE_CLEARANCE && x < (prop.toX ?? prop.x) + SAWHORSE_CLEARANCE;
  });
};

/** A drum on the sidewalk: two white bands on the orange, a dark lid, a flasher on the near one. */
const Barrel = ({ x, groundY, lamp }: { x: number; groundY: number; lamp: boolean }): JSX.Element => {
  const left = x - BARREL_WIDTH / 2;
  const top = groundY - BARREL_HEIGHT;

  return (
    <g>
      <rect x={left - 0.35} y={groundY - 0.7} width={BARREL_WIDTH + 0.7} height={0.9} rx={0.3} fill={schlonicPalette.barrelDark} />
      <rect x={left} y={top} width={BARREL_WIDTH} height={BARREL_HEIGHT - 0.5} rx={0.9} fill={schlonicPalette.barrel} />
      <rect x={left} y={top + 1.2} width={BARREL_WIDTH} height={0.95} fill={schlonicPalette.barrelStripe} />
      <rect x={left} y={top + 3} width={BARREL_WIDTH} height={0.95} fill={schlonicPalette.barrelStripe} />
      <rect x={left + 0.2} y={top - 0.35} width={BARREL_WIDTH - 0.4} height={0.7} rx={0.3} fill={schlonicPalette.barrelDark} />
      <rect x={left + 0.4} y={top + 0.3} width={0.5} height={BARREL_HEIGHT - 1.3} fill={schlonicPalette.barrelStripe} opacity={0.25} />
      {lamp && <circle cx={x} cy={top - 1} r={0.75} fill={schlonicPalette.barrelLamp} stroke={schlonicPalette.barrelDark} strokeWidth={0.25} />}
    </g>
  );
};

/** A sawhorse barricade: a striped board on two splayed legs. */
const Sawhorse = ({ x, groundY }: { x: number; groundY: number }): JSX.Element => {
  const left = x - SAWHORSE_WIDTH / 2;
  const boardTop = groundY - SAWHORSE_HEIGHT;
  const stripes = [0, 1.6, 3.2, 4.8];

  return (
    <g>
      <path
        d={`M ${left + 0.8} ${groundY} L ${left + 1.6} ${boardTop + 1} M ${left + 2.4} ${groundY} L ${left + 1.6} ${boardTop + 1} M ${left + SAWHORSE_WIDTH - 0.8} ${groundY} L ${left + SAWHORSE_WIDTH - 1.6} ${boardTop + 1} M ${left + SAWHORSE_WIDTH - 2.4} ${groundY} L ${left + SAWHORSE_WIDTH - 1.6} ${boardTop + 1}`}
        stroke={schlonicPalette.barrelDark}
        strokeWidth={0.45}
        strokeLinecap="round"
      />
      <rect x={left} y={boardTop} width={SAWHORSE_WIDTH} height={1.5} fill={schlonicPalette.barrelStripe} />
      <g fill={schlonicPalette.barrel}>
        {stripes.map((stripe) => (
          <path
            key={stripe}
            d={`M ${left + stripe} ${boardTop + 1.5} L ${left + stripe + 0.8} ${boardTop} L ${left + stripe + 1.6} ${boardTop} L ${left + stripe + 0.8} ${boardTop + 1.5} Z`}
          />
        ))}
      </g>
      <rect x={left} y={boardTop} width={SAWHORSE_WIDTH} height={1.5} fill="none" stroke={schlonicPalette.barrelDark} strokeWidth={0.2} />
    </g>
  );
};

export const Roadworks = ({ zone }: { zone: SchlonicZone }): JSX.Element => (
  <g data-schlonic-roadworks>
    {zone.pits.map((pit) => {
      const nearX = pit.fromX - BARREL_SETBACK;
      const farX = pit.toX + BARREL_SETBACK;
      const sawhorseX = nearX - SAWHORSE_SETBACK;

      return (
        <g key={pit.fromX} data-schlonic-trench={pit.fromX}>
          {!isKitNear(zone, sawhorseX) && (
            <Sawhorse x={sawhorseX} groundY={resolveSchlonicGroundY(zone, sawhorseX)} />
          )}
          <Barrel x={nearX} groundY={resolveSchlonicGroundY(zone, nearX)} lamp />
          <Barrel x={farX} groundY={resolveSchlonicGroundY(zone, farX)} lamp={false} />
        </g>
      );
    })}
  </g>
);
