// Scene materials for the "Dusk Desert" lane (DESIGN.md §2.7). These are
// drawing content — the sand, the cacti, the shot — not UI chrome, and are
// exempt from the two-accent budget the way the drawing inks are. The birds
// standing in the lane are NOT here: they are cast members (§2.8) and wear
// their own team's theme colour.
export const joustPalette = {
  skyTop: "#160c2a",
  skyMid: "#4a1f3f",
  horizon: "#c2582c",
  star: "#fde7c5",
  sun: "#f9a51a",
  mesaFar: "#3a1738",
  mesaNear: "#63293a",
  duneFar: "#7a4a30",
  duneNear: "#9c6238",
  sand: "#d6ac63",
  sandDark: "#b58a45",
  sandLine: "#6e4f26",
  // What a bird or a tower casts on the sand: the post's own dark, thinned by opacity.
  shadow: "#3d2411",
  cactus: "#3f9d55",
  cactusDark: "#26683a",
  cactusLight: "#7dcf8a",
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
