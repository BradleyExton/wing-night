import { useId } from "react";

import type { OutfitItemProps } from "../../context/index.js";
import { micDrop } from "../../paths/sharedRail/index.js";
import * as styles from "./styles.js";

// drumstick a (shared Prop), ported from the harness's shared.js: the mic
// drop, a drumstick hanging from the wing tip behind the legs, the moment
// after the last line. A white bone with a two-lobed knuckle and a fat ember
// meat (the house cooked colour, in every style); the style paints only the
// sauce. Team and gold glaze the meat's tip end with a wavy cap and one drip
// off the tip; ink is BBQ char, two blotches on the meat's rim (three stripes
// read as a bee). The parts share one merged outline.
//
// Shared, so it hangs per body (`micDrop` reads the silhouette): the drip
// ends high enough that the pop squash and the broody walk tuck never swing
// it under the floor.
export const DrumstickA = ({ context }: OutfitItemProps): JSX.Element => {
  const clipId = useId();
  const style = context.style ?? "team";
  const glazed = style !== "ink";
  const p = micDrop(context.silhouette);
  const parts = [
    { d: p.bone, fill: styles.whiteFill },
    ...p.lobes.map((d) => ({ d, fill: styles.whiteFill })),
    ...(glazed ? [{ d: p.drip, fill: styles.styleFill[style] }] : []),
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
      <defs>
        <clipPath id={clipId}>
          <path d={p.meat} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {glazed ? (
          <path className={styles.styleFill[style]} d={p.cap} />
        ) : (
          p.char.map((d) => <path key={d} className={styles.inkFill} d={d} />)
        )}
      </g>
    </g>
  );
};
