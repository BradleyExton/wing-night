import { resolveSchlongPaths, type SchlongVec2 } from "@wingnight/cast";

import { schlonicPalette } from "../../palette.js";

export const OUTLINE_WIDTH = 0.45;

export type SchlongSkin = {
  body: string;
  dark: string;
  light: string;
  vein: string;
};

export const PINK: SchlongSkin = {
  body: schlonicPalette.schlong,
  dark: schlonicPalette.schlongDark,
  light: schlonicPalette.schlongLight,
  vein: schlonicPalette.schlongVein
};

export const EBONY: SchlongSkin = {
  body: schlonicPalette.ebony,
  dark: schlonicPalette.ebonyDark,
  light: schlonicPalette.ebonyLight,
  vein: schlonicPalette.ebonyVein
};

export const IVORY: SchlongSkin = {
  body: schlonicPalette.ivory,
  dark: schlonicPalette.ivoryDark,
  light: schlonicPalette.ivoryLight,
  vein: schlonicPalette.ivoryVein
};

export const CRIMSON: SchlongSkin = {
  body: schlonicPalette.thorn,
  dark: schlonicPalette.thornDark,
  light: schlonicPalette.schlongLight,
  vein: schlonicPalette.thornDark
};

// The skins an enemy is dealt from, weighted the way FAPPY deals its champs: pink is the
// staple, the other two break up the row.
const BADNIK_SKINS: readonly SchlongSkin[] = [PINK, PINK, EBONY, IVORY];

/** Which skin a badnik wears: from its index in the zone, so every machine dresses it alike. */
export const resolveBadnikSkin = (index: number): SchlongSkin => {
  return BADNIK_SKINS[(index * 7 + 3) % BADNIK_SKINS.length] ?? PINK;
};

// One body along a spine, in the cast's own drawing (§2.8, `resolveSchlongPaths`): the shaft,
// the gloss down its lit side, the rim and the slit — and, on the ones big enough to carry
// them, the veins. Everything in the zone that is not a wing or the ground is one of these.
export const SchlongBody = ({
  spine,
  shaftRadius,
  headRadius,
  skin,
  veined = false
}: {
  spine: SchlongVec2[];
  shaftRadius: number;
  headRadius: number;
  skin: SchlongSkin;
  veined?: boolean;
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
      {veined && (
        <path
          d={paths.veins}
          fill="none"
          stroke={skin.vein}
          strokeWidth={OUTLINE_WIDTH * 0.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        />
      )}
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
