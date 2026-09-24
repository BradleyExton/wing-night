import type { JoustVec2 } from "@wingnight/shared";
import { JOUST_PERCH_POINTS_TIER, JOUST_PERCH_THICKNESS } from "@wingnight/shared";

import { joustPalette } from "../../palette.js";

/**
 * What a shelf is dressed as, by how high it lifts a player: under a points tier of rise it is
 * a dock on pilings at the water's edge, and from there up it is a lifeguard tower. Skin only —
 * the plank and the legs are drawn where the integrator has them whatever they are dressed as.
 */
export type PerchSkinKind = "dock" | "lifeguard-tower";

export const resolvePerchSkin = (rise: number): PerchSkinKind => {
  return rise < JOUST_PERCH_POINTS_TIER ? "dock" : "lifeguard-tower";
};

/** The plank's own paint, by skin: weathered dock timber, or the tower's white. */
export const resolvePlankPaint = (skin: PerchSkinKind): { fill: string; stroke: string } => {
  return skin === "dock"
    ? { fill: joustPalette.dock, stroke: joustPalette.dockDark }
    : { fill: joustPalette.lifeguard, stroke: joustPalette.postDark };
};

/** The legs' paint, by skin: dark pilings under a dock, white timber under a tower. */
export const resolveLegPaint = (skin: PerchSkinKind): string => {
  return skin === "dock" ? joustPalette.dockDark : joustPalette.lifeguard;
};

const DECK_BOARD_SPACING = 3;

/**
 * The dressing on top of the plank, laid along its CURRENT span — the two ends the legs' tops
 * put it at — so a folding tower's rail comes down with it. Everything here is measured off the
 * plank's own axis: `along` runs from one end to the other, `up` is its normal, and the slab's
 * top face sits `JOUST_PERCH_THICKNESS` up from the ends it was given.
 */
export const PerchSkin = ({
  skin,
  from,
  to
}: {
  skin: PerchSkinKind;
  from: JoustVec2;
  to: JoustVec2;
}): JSX.Element => {
  const alongX = to.x - from.x;
  const alongY = to.y - from.y;
  const length = Math.sqrt(alongX * alongX + alongY * alongY) || 1;
  const along = { x: alongX / length, y: alongY / length };
  const up = { x: alongY / length, y: -alongX / length };
  /** A point `run` along the plank from its near end and `lift` up off its bottom edge. */
  const at = (run: number, lift: number): JoustVec2 => ({
    x: from.x + along.x * run + up.x * lift,
    y: from.y + along.y * run + up.y * lift
  });
  const top = JOUST_PERCH_THICKNESS;

  if (skin === "dock") {
    const boards = Math.max(0, Math.floor((length - 2) / DECK_BOARD_SPACING));

    return (
      <g data-joust-perch-skin="dock">
        {/* Deck boards: a tick across the plank's face per board, so a dock reads as decking. */}
        {Array.from({ length: boards }, (_unused, board) => {
          const run = 1 + (board + 0.5) * DECK_BOARD_SPACING;
          const lower = at(run, 0.4);
          const upper = at(run, top - 0.4);

          return (
            <line
              key={board}
              x1={lower.x}
              y1={lower.y}
              x2={upper.x}
              y2={upper.y}
              stroke={joustPalette.dockDark}
              strokeWidth={0.35}
              opacity={0.55}
            />
          );
        })}
        {/* Two cleats on the deck, one each end, which is how the room knows it is a dock. */}
        {[0.12, 0.88].map((share) => {
          const centre = at(length * share, top + 0.4);

          return (
            <rect
              key={share}
              x={centre.x - 0.9}
              y={centre.y - 0.4}
              width={1.8}
              height={0.8}
              rx={0.3}
              fill={joustPalette.dockDark}
              transform={`rotate(${(Math.atan2(along.y, along.x) * 180) / Math.PI} ${centre.x} ${centre.y})`}
            />
          );
        })}
      </g>
    );
  }

  // A lifeguard tower: a red rail along the front of the platform, on a post at each end. It is
  // low — the height of a bird's shins — so a row of birds stands in front of it, not behind it.
  const railHeight = 2.4;
  const railFrom = at(1, top + railHeight);
  const railTo = at(length - 1, top + railHeight);

  return (
    <g data-joust-perch-skin="lifeguard-tower">
      {[1, length - 1].map((run) => {
        const foot = at(run, top);
        const head = at(run, top + railHeight);

        return (
          <line
            key={run}
            x1={foot.x}
            y1={foot.y}
            x2={head.x}
            y2={head.y}
            stroke={joustPalette.lifeguardRail}
            strokeWidth={0.7}
            strokeLinecap="round"
          />
        );
      })}
      <line
        x1={railFrom.x}
        y1={railFrom.y}
        x2={railTo.x}
        y2={railTo.y}
        stroke={joustPalette.lifeguardRail}
        strokeWidth={0.7}
        strokeLinecap="round"
      />
    </g>
  );
};
