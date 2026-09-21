import { resolveSchlongPaths, type SchlongVec2 } from "@wingnight/cast";

import { schlonicPalette } from "../../palette.js";

export const OUTLINE_WIDTH = 0.45;

export type SchlongSkin = {
  body: string;
  dark: string;
  light: string;
};

export const PINK: SchlongSkin = {
  body: schlonicPalette.schlong,
  dark: schlonicPalette.schlongDark,
  light: schlonicPalette.schlongLight
};

export const CRIMSON: SchlongSkin = {
  body: schlonicPalette.thorn,
  dark: schlonicPalette.thornDark,
  light: schlonicPalette.schlongLight
};

// One body along a spine, in the cast's own drawing (§2.8, `resolveSchlongPaths`): the shaft,
// the gloss down its lit side, the rim and the slit. Everything in the zone that is not a wing
// or the ground is one of these.
export const SchlongBody = ({
  spine,
  shaftRadius,
  headRadius,
  skin
}: {
  spine: SchlongVec2[];
  shaftRadius: number;
  headRadius: number;
  skin: SchlongSkin;
}): JSX.Element => {
  const paths = resolveSchlongPaths(spine, { shaftRadius, headRadius });

  return (
    <g>
      <path
        d={paths.body}
        fill={skin.body}
        stroke={skin.dark}
        strokeWidth={OUTLINE_WIDTH}
        strokeLinejoin="round"
      />
      <path d={paths.gloss} fill={skin.light} opacity={0.6} />
      <path
        d={paths.corona}
        fill="none"
        stroke={skin.dark}
        strokeWidth={OUTLINE_WIDTH * 0.9}
        strokeLinecap="round"
        opacity={0.8}
      />
      <path
        d={paths.slit}
        fill="none"
        stroke={skin.dark}
        strokeWidth={OUTLINE_WIDTH * 0.8}
        strokeLinecap="round"
        opacity={0.7}
      />
    </g>
  );
};
