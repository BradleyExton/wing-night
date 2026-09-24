// Scene materials for the corridor (DESIGN.md §2.9): the same dusk desert
// JOUST flies over, so the room recognises the world; the champs standing in
// it come in three skins — bubblegum pink (the Genital Jousting joke, and the
// one hue in the desert that is neither its sand nor its sky, so a row of
// them reads from the sofa), a big dark one and a pale one, so the row is a
// line-up and not a fence; the eagle is a bald one, because it is funnier;
// the cliffs are the desert's own sand and rock, the dunes behind them
// JOUST's, and the tufts on the plateaus its cactus green. A spitter's open
// mouth is a dark wet red inside, and what it spits is off-white with a
// faint edge so it holds against the sky. Drawing content, not UI chrome —
// exempt from the two-accent budget the way the drawing inks and the JOUST
// arena are.
export const fappyPalette = {
  champ: "#f9a3bc",
  champDark: "#8e2a52",
  champLight: "#ffe6ee",
  champVein: "#c4577f",
  ebony: "#4b2a20",
  ebonyDark: "#1a0a06",
  ebonyLight: "#8c5a46",
  ebonyVein: "#8a5443",
  ivory: "#f4e3d3",
  ivoryDark: "#a9735c",
  ivoryLight: "#ffffff",
  ivoryVein: "#cf9f8b",
  mouth: "#5a1230",
  spit: "#fbf7f0",
  spitEdge: "#d8cbb6",
  shadow: "#3d2411",
  eye: "#fff7ed",
  pupil: "#1c0d02",
  eagle: "#3b2314",
  eagleDark: "#1c0d02",
  eagleFeather: "#5a3a22",
  eagleHead: "#f5efe6",
  eagleBeak: "#f9a51a",
  cliff: "#b58a45",
  cliffLight: "#d6ac63",
  cliffEdge: "#6e4f26",
  rock: "#4a2f18",
  rockLight: "#5e3d22",
  rockEdge: "#2c1a0c",
  duneFar: "#5a2f3a",
  duneNear: "#7a4a30",
  sun: "#f9a51a",
  sunGlow: "#c2582c",
  star: "#fff7ed",
  cactus: "#3f9d55",
  cactusDark: "#26683a",
  pole: "#6b4423",
  flag: "#fbbf24",
  flagEdge: "#8a4b06",
  strip: "#fbbf24",
  puff: "#d6ac63",
  sandLine: "#6e4f26"
} as const;
