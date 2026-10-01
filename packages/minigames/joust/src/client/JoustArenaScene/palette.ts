// Scene materials for the "Centennial Beach at Dusk" lane (DESIGN.md §2.7): the same Kempenfelt
// Bay shore SCHLONIC runs along on a summer morning (§2.11), seen from Centennial Beach as the
// sun goes down over the head of the bay. These are drawing content — the water, the beach, the
// props, the shot — not UI chrome, and are exempt from the two-accent budget the way the drawing
// inks are. The birds standing in the lane are NOT here: they are cast members (§2.8) and wear
// their own team's theme colour.
export const joustPalette = {
  skyTop: "#160c2a",
  skyMid: "#4a1f3f",
  horizon: "#c2582c",
  star: "#fde7c5",
  sun: "#f9a51a",
  // The far shore across the bay — Oro's bank and its treeline, hazed to two purples by the
  // distance and the dusk, and the odd porch light coming on along it.
  shoreFar: "#4a1e42",
  shoreFarTrees: "#2f1234",
  shoreLight: "#ffd9a0",
  // The bay itself, carrying the sky: the horizon's glow at the far edge, then deepening toward
  // the beach, with the sun's column broken across it in the same dashes SCHLONIC's morning uses.
  bayFar: "#8c3d48",
  bay: "#3b1c44",
  bayNear: "#241233",
  bayGlitter: "#ffc46b",
  foam: "#e9c9a3",
  // The landmarks, in silhouette: the same shapes as the morning, with the light behind them. The
  // windows downtown are the one thing lit.
  silhouette: "#22102b",
  glass: "#ffcf8a",
  // The twin condos' balcony glass, the blue edges the room knows them by in daylight: at dusk it
  // holds the glow off the far edge of the bay rather than a lit room, so the pair still reads as
  // glass-edged towers without outshining downtown's windows.
  condoGlass: "#8c3d48",
  // The beach: wet at the water's edge, and dry sand below the floor line where the rack stands.
  beachWet: "#b8894e",
  sand: "#d3a75f",
  sandDark: "#ad8340",
  sandLine: "#5f4020",
  // What a bird or a tower casts on the sand: the post's own dark, thinned by opacity.
  shadow: "#3d2411",
  // The props a lane is furnished with — the chairs, the canoe, the chip truck, the umbrella —
  // in the bright paint beach furniture actually comes in, because they are things a shot hits
  // and have to read as solid from the sofa.
  propWhite: "#f3e9d6",
  propRed: "#c8433a",
  propRedDark: "#7d251f",
  propCream: "#f6e3b6",
  propCanvas: "#e8b23a",
  propStripe: "#fff7e8",
  propHull: "#b83d2f",
  propDark: "#2b1a12",
  propTyre: "#1e1410",
  // The scaffolding the rack stands on, skinned by height (§2.7): a low shelf is a dock in
  // weathered timber, a high one a lifeguard tower in white with a red rail.
  dock: "#8a6a45",
  dockDark: "#4f3a22",
  lifeguard: "#efe6d3",
  lifeguardRail: "#c8433a",
  // The landmarks a shelf can be BUILT as (§2.7) — the Queen's balcony, Souldiers' roof, a condo
  // balcony — in dusk paint: the morning's brick, buff and cream (SCHLONIC's palette) darkened
  // and warmed by the sunset off the bay, and their windows holding the same glow as downtown's
  // (`glass`). Every one is kept lower-contrast than the eight team colours on purpose: a bird on
  // the balcony has to win the eye over the building under it.
  queensBuff: "#b08a5a",
  queensBuffDark: "#7f6240",
  queensGreen: "#1d4a2c",
  queensCream: "#f1dcb2",
  souldiersBrick: "#80402f",
  souldiersBrickDark: "#4f261b",
  souldiersGreen: "#2e7d3b",
  signInk: "#1a0f0a",
  signLetter: "#f4e4c8",
  condoCream: "#c7ae8c",
  condoCreamDark: "#947c5e",
  // The near condo's balcony glass: blue-violet with the dusk in it, not the far pair's bay glow,
  // because this one stands in the lane and has to read as glass rather than as more sky.
  condoBalconyGlass: "#6f6a9e",
  // Meridian Place's downtown furniture: a black acorn lamp post lit for the evening, and a stone
  // planter whose shrub has gone blue-green in the dusk.
  lampPost: "#1f1a1c",
  planterStone: "#8a7f70",
  planterStoneDark: "#5c5247",
  shrub: "#3d6b3f",
  shrubDark: "#274a2c",
  post: "#6b4423",
  postDark: "#3d2411",
  band: "#2a1b12",
  shooter: "#f97316",
  shooterDark: "#b8410a",
  shooterLight: "#fdba74",
  eye: "#fff7ed",
  pupil: "#1c0d02",
  burst: "#fbbf24",
  burstCore: "#fff7ed"
} as const;
