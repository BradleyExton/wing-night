// Scene materials for the corridor (DESIGN.md §2.9): the same dusk desert
// JOUST flies over, so the room recognises the world and the champ standing
// in it. Drawing content, not UI chrome — exempt from the two-accent budget
// the way the drawing inks and the JOUST arena are.
export const fappyPalette = {
  champ: "#22c9e6",
  champDark: "#0b7f97",
  champLight: "#a5f3fc",
  eye: "#fff7ed",
  pupil: "#1c0d02",
  sandLine: "#6e4f26"
} as const;
