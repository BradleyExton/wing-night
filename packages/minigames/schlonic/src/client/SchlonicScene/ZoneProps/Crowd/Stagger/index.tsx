import type { SchlonicProp } from "@wingnight/shared";
import { SCHLONIC_HAZARDS } from "@wingnight/shared";

import { schlonicPalette } from "../../../palette.js";
import { GroundShadow } from "../../GroundShadow/index.js";
import { CrowdBird } from "../CrowdBird/index.js";
import * as styles from "../styles.js";

const APPEARANCE = { body: "round", comb: "none", tail: "fan", dance: "bounce" } as const;
const SCALE = 0.165;
const LEAN = 11;

/**
 * The show-goer: a pigeon out of the Queen's at four in the afternoon, weaving across the
 * sidewalk with a can, leaning where it is going before its feet get there. Tall, and the
 * fastest mover on the street — the unpredictable one.
 */
export const Stagger = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { width } = SCHLONIC_HAZARDS.stagger;

  return (
    <g>
      <GroundShadow x={prop.x} y={prop.y} radius={width * 0.55} />
      <CrowdBird x={prop.x} y={prop.y} scale={SCALE} colorClassName={styles.scenePigeon} appearance={APPEARANCE} silhouette="broody" pose="walk" lean={LEAN}>
        {/* The can, held up and out. */}
        <rect x={60} y={30} width={5.5} height={10} rx={1} fill={schlonicPalette.can} stroke={schlonicPalette.sandal} strokeWidth={0.8} />
        <rect x={60} y={33} width={5.5} height={3.5} fill={schlonicPalette.canLabel} />
      </CrowdBird>
    </g>
  );
};
