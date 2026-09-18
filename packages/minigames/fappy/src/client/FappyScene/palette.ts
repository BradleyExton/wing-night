// Scene materials for the corridor (DESIGN.md §2.9): the same dusk desert
// JOUST flies over, so the room recognises the world and the champ standing
// in it; the eagle is a bald one, because it is funnier; the cliffs are the
// desert's own sand and rock. Drawing content, not UI chrome — exempt from
// the two-accent budget the way the drawing inks and the JOUST arena are.
export const fappyPalette = {
  champ: "#22c9e6",
  champDark: "#0b7f97",
  champLight: "#a5f3fc",
  eye: "#fff7ed",
  pupil: "#1c0d02",
  eagle: "#3b2314",
  eagleDark: "#1c0d02",
  eagleHead: "#f5efe6",
  eagleBeak: "#f9a51a",
  cliff: "#b58a45",
  cliffEdge: "#6e4f26",
  rock: "#4a2f18",
  rockEdge: "#2c1a0c",
  pole: "#6b4423",
  flag: "#fbbf24",
  flagEdge: "#8a4b06",
  sandLine: "#6e4f26"
} as const;
