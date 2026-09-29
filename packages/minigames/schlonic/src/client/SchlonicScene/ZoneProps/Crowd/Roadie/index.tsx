import type { SchlonicProp } from "@wingnight/shared";
import { SCHLONIC_HAZARDS } from "@wingnight/shared";

import { schlonicPalette } from "../../../palette.js";
import { GroundShadow } from "../../GroundShadow/index.js";
import { CrowdBird } from "../CrowdBird/index.js";
import * as styles from "../styles.js";

const APPEARANCE = { body: "wide", comb: "crest", tail: "fan", dance: "headbang" } as const;
const SCALE = 0.155;
const OUTLINE = 0.5;
/** The cab's box, stood on its dolly ahead of the bird. */
const CAB_WIDTH = 5.4;
const CAB_HEIGHT = 8.2;
const DOLLY_HEIGHT = 1.2;

/**
 * The roadie: a crow in a battle vest walking a full bass cab across the sidewalk on a dolly,
 * from the van to the Queen's back door. Tall and wide, and it moves — slowly, the way a cab
 * moves — which is what makes it a timing rather than a height.
 */
export const Roadie = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { width } = SCHLONIC_HAZARDS.roadie;
  const cabLeft = prop.x + width / 2 - CAB_WIDTH;
  const cabTop = prop.y - DOLLY_HEIGHT - CAB_HEIGHT;

  return (
    <g>
      <GroundShadow x={prop.x} y={prop.y} radius={width * 0.55} />
      <CrowdBird x={prop.x - width / 2 + 3.2} y={prop.y} scale={SCALE} colorClassName={styles.sceneCrow} appearance={APPEARANCE} silhouette="spiky" pose="walk" lean={6}>
        {/* The vest's back patch. */}
        <rect x={40} y={36} width={16} height={12} rx={1.5} fill={schlonicPalette.canLabel} opacity={0.85} />
        <rect x={43} y={39} width={10} height={6} fill={schlonicPalette.cabPiping} opacity={0.9} />
      </CrowdBird>
      {/* The dolly, then the cab on it. */}
      <rect x={cabLeft - 0.4} y={prop.y - DOLLY_HEIGHT} width={CAB_WIDTH + 0.8} height={0.5} fill={schlonicPalette.dolly} />
      <circle cx={cabLeft + 0.6} cy={prop.y - 0.5} r={0.55} fill={schlonicPalette.carTyre} />
      <circle cx={cabLeft + CAB_WIDTH - 0.6} cy={prop.y - 0.5} r={0.55} fill={schlonicPalette.carTyre} />
      <rect x={cabLeft} y={cabTop} width={CAB_WIDTH} height={CAB_HEIGHT} rx={0.4} fill={schlonicPalette.cab} stroke={schlonicPalette.boardInk} strokeWidth={OUTLINE} />
      <rect x={cabLeft + 0.6} y={cabTop + 0.6} width={CAB_WIDTH - 1.2} height={CAB_HEIGHT - 1.2} fill={schlonicPalette.cabGrille} />
      <rect x={cabLeft + 0.6} y={cabTop + 0.6} width={CAB_WIDTH - 1.2} height={0.35} fill={schlonicPalette.cabPiping} />
      {/* The handle over the top, and the speaker's own logo plate. */}
      <path d={`M ${cabLeft + 1.4} ${cabTop} Q ${cabLeft + CAB_WIDTH / 2} ${cabTop - 1.4} ${cabLeft + CAB_WIDTH - 1.4} ${cabTop}`} fill="none" stroke={schlonicPalette.cab} strokeWidth={0.7} strokeLinecap="round" />
      <rect x={cabLeft + CAB_WIDTH - 2} y={cabTop + CAB_HEIGHT - 1.6} width={1.2} height={0.5} fill={schlonicPalette.cabPiping} />
    </g>
  );
};
