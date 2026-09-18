// Scene materials for the corridor (DESIGN.md §2.9): the same dusk desert
// JOUST flies over, so the room recognises the world and the champ standing
// in it; the eagle is a bald one, because it is funnier; the cliffs are the
// desert's own sand and rock, the dunes behind them JOUST's, and the tufts on
// the plateaus its cactus green. Drawing content, not UI chrome — exempt from
// the two-accent budget the way the drawing inks and the JOUST arena are.
export const fappyPalette = {
  champ: "#22c9e6",
  champDark: "#0b7f97",
  champLight: "#a5f3fc",
  champBlush: "#67e8f9",
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
