import type { SchlonicProp } from "@wingnight/shared";
import { SCHLONIC_HAZARDS } from "@wingnight/shared";

import { schlonicPalette } from "../../../palette.js";
import { GroundShadow } from "../../GroundShadow/index.js";
import { CrowdBird } from "../CrowdBird/index.js";
import * as styles from "../styles.js";

/** A crow's own figure: a mohawk, the spiky body, and a plume of a tail. */
const APPEARANCE = { body: "tall", comb: "mohawk", tail: "plume", dance: "bounce" } as const;
const SCALE = 0.13;
const SLOUCH = -14;
/** The studs down the jacket's shoulder, in the figure's own units. */
const STUDS = [
  { x: 44, y: 34 },
  { x: 49, y: 33 },
  { x: 54, y: 33 },
  { x: 59, y: 35 }
] as const;

/**
 * The crust punk: a crow in a studded jacket, mohawk up, slouched back against the wall outside
 * Souldiers with a tallboy on the ground beside it. Short and still — the easy one.
 */
export const Punk = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { width } = SCHLONIC_HAZARDS.punk;
  const canX = prop.x + width / 2 - 0.6;

  return (
    <g>
      <GroundShadow x={prop.x} y={prop.y} radius={width * 0.55} />
      <CrowdBird x={prop.x - 0.6} y={prop.y} scale={SCALE} colorClassName={styles.sceneCrow} appearance={APPEARANCE} silhouette="spiky" lean={SLOUCH}>
        {STUDS.map((stud) => (
          <circle key={stud.x} cx={stud.x} cy={stud.y} r={1.6} fill={schlonicPalette.stud} />
        ))}
      </CrowdBird>
      {/* The tallboy. */}
      <rect x={canX - 0.9} y={prop.y - 3.4} width={1.8} height={3.4} rx={0.3} fill={schlonicPalette.can} stroke={schlonicPalette.sandal} strokeWidth={0.3} />
      <rect x={canX - 0.9} y={prop.y - 2.5} width={1.8} height={1.2} fill={schlonicPalette.canLabel} />
    </g>
  );
};
