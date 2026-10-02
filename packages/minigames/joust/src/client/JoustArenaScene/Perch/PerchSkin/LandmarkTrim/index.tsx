import type { JoustVec2 } from "@wingnight/shared";

import { joustPalette } from "../../../palette.js";

export type LandmarkTrimSkin = "queens-balcony" | "souldiers-roof" | "condo-balcony";

type TrimProps = {
  skin: LandmarkTrimSkin;
  /** A point `run` along the plank from its near end and `lift` up off its bottom edge. */
  at: (run: number, lift: number) => JoustVec2;
  /** The plank's own axis, unit length. */
  along: JoustVec2;
  length: number;
  /** Where the slab's top face sits, up off the plank's bottom edge. */
  top: number;
};

/** The rails stand shin-high on a bird, so a row of birds stands in front of them, not behind. */
const RAIL_HEIGHT = 2.4;
/** Where the Queen's flags lean out off the balcony rail, as shares of the plank's run. */
const FLAG_SHARES = [0.18, 0.5, 0.82];

const degrees = (along: JoustVec2): number => (Math.atan2(along.y, along.x) * 180) / Math.PI;

/** A quadrilateral between two runs along the plank, from one lift to another. */
const band = (at: TrimProps["at"], fromRun: number, toRun: number, lower: number, upper: number): string => {
  const a = at(fromRun, lower);
  const b = at(toRun, lower);
  const c = at(toRun, upper);
  const d = at(fromRun, upper);

  return `M${a.x} ${a.y} L${b.x} ${b.y} L${c.x} ${c.y} L${d.x} ${d.y} Z`;
};

/**
 * What the plank wears when the shelf is a landmark: the Queen's white balcony railing with its
 * small red flags, Souldiers' parapet cap one course proud of the roof, or a condo balcony's thin
 * glass rail. All of it is measured off the plank's current axis, so it folds with the frame
 * like the dock's cleats and the tower's rail do.
 */
export const LandmarkTrim = ({ skin, at, along, length, top }: TrimProps): JSX.Element => {
  if (skin === "souldiers-roof") {
    return (
      <g data-joust-perch-skin="souldiers-roof">
        <path d={band(at, -0.5, length + 0.5, top - 0.2, top + 0.9)} fill={joustPalette.souldiersBrickDark} stroke={joustPalette.signInk} strokeWidth={0.3} strokeLinejoin="round" />
      </g>
    );
  }

  if (skin === "condo-balcony") {
    return (
      <g data-joust-perch-skin="condo-balcony">
        <path d={band(at, 0.8, length - 0.8, top, top + RAIL_HEIGHT)} fill={joustPalette.condoBalconyGlass} opacity={0.55} />
        <path d={band(at, 0.8, length - 0.8, top + RAIL_HEIGHT - 0.4, top + RAIL_HEIGHT)} fill={joustPalette.condoCream} />
      </g>
    );
  }

  // The Queen's balcony: two white rails with balusters between, and a few small red flags.
  const balusters = Math.max(0, Math.floor((length - 2) / 2.2));

  return (
    <g data-joust-perch-skin="queens-balcony">
      <g fill={joustPalette.lifeguard}>
        {Array.from({ length: balusters }, (_unused, index) => {
          const run = 1.6 + index * 2.2;

          return <path key={index} d={band(at, run - 0.25, run + 0.25, top, top + RAIL_HEIGHT)} />;
        })}
        <path d={band(at, 0.8, length - 0.8, top + RAIL_HEIGHT - 0.5, top + RAIL_HEIGHT)} />
        <path d={band(at, 0.8, length - 0.8, top, top + 0.4)} />
      </g>
      {FLAG_SHARES.map((share) => {
        const run = length * share;
        const foot = at(run, top + RAIL_HEIGHT);
        const head = at(run - 0.9, top + RAIL_HEIGHT + 2.6);

        return (
          <g key={share}>
            <line x1={foot.x} y1={foot.y} x2={head.x} y2={head.y} stroke={joustPalette.lifeguard} strokeWidth={0.3} />
            <g transform={`rotate(${degrees(along)} ${head.x} ${head.y})`}>
              <rect x={head.x} y={head.y - 0.2} width={2} height={1.2} fill={joustPalette.propRed} />
              <rect x={head.x + 0.65} y={head.y - 0.2} width={0.7} height={1.2} fill={joustPalette.lifeguard} />
            </g>
          </g>
        );
      })}
    </g>
  );
};
