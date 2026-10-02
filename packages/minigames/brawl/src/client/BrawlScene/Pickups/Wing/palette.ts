// What the wing on the pavement is painted in, as class names on the house tokens like every goon
// colour (`../../Goons/palette.ts`), never a hex. SCHLONIC's wing (`SchlonicScene/Wing`) is the
// same drawing in that scene's own hex palette, which BRAWL's no-hex rule and the package boundary
// both keep out of here; this is it in the night's tokens — the house orange for the sauce, the
// hearth's near-white for the glaze, white bone shaded warm.
//
// Merged into `brawlGoonPalette` (`../../Goons/palette.ts`), which is what the wing is handed: the
// values are written here, beside the drawing that uses them, and nowhere else.
export type BrawlWingPalette = {
  /** The sauce on the meat: the house orange, the beak's own. */
  sauce: string;
  /** The glaze catching the lamplight along the lobe's top. */
  sauceGloss: string;
  /** The bone and its two knuckles, and the warm shade down its underside. */
  bone: string;
  boneShade: string;
};

export const brawlWingPalette: BrawlWingPalette = {
  sauce: "fill-primary",
  sauceGloss: "fill-glowHot",
  bone: "fill-text",
  boneShade: "fill-mutedWarm"
};
