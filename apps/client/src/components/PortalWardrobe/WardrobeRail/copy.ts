// Every word on the wardrobe's rail. No item names on the tiles (research §2.5): a name is said
// in the status line when it is tapped, and read out by a screen reader from the tile's label.
export const wardrobeRailCopy = {
  kitNote: "Kit: worn in every game.",
  showpieceNote: "Showpieces: parade and lineup only.",
  none: "None",
  stylesLabel: (slot: string): string => `${slot} styles`
} as const;
