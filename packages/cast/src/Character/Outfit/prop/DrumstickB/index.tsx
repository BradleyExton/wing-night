import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { raisedDrumstick } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// drumstick b (shared Prop), ported from the harness's shared.js: raised and
// bitten, the drumstick held up like a mic or a toast, knuckle at the wing
// tip, a fat ember meat (r 7.4) standing up and back over the tail with one
// big round bite out of its underside: a single smooth arc, never a row of
// scallops (scallops read as teeth). White is the plain roast, no sauce; team
// and gold glaze the top third. No ink: char beside a bite would make a face.
//
// Shared, so it is raised per body (`raisedDrumstick` reads the silhouette),
// steep enough that the flap and the Night Fever drop never swing it under
// the floor.
export const DrumstickB = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();
  const style = context.style ?? "white";
  const p = raisedDrumstick(context.silhouette);
  const parts = [
    { d: p.bone, fill: styles.whiteFill },
    ...p.lobes.map((d) => ({ d, fill: styles.whiteFill })),
    { d: p.meat, fill: styles.emberFill }
  ];

  return (
    <g>
      {parts.map(({ d }) => (
        <path key={`outline-${d}`} className={styles.mergedOutline} d={d} />
      ))}
      {parts.map(({ d, fill }) => (
        <path key={`fill-${d}`} className={fill} d={d} />
      ))}
      {style !== "white" && (
        <>
          <defs>
            <clipPath id={clipId}>
              <path d={p.meat} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <path className={styles.styleFill[style]} d={p.cap} />
          </g>
        </>
      )}
    </g>
  );
};
