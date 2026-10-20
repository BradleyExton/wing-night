// Every word on the wardrobe's stage.
export const wardrobeStageCopy = {
  hint: "Tap your bird to see its move",
  tvSize: "TV size",
  parade: "130 · the parade",
  game: "76 · in a game",
  playLabel: (label: string): string => `${label} Tap to play its move.`,
  tvLabel: (label: string): string => `${label} At TV size: 130 pixels in the parade, 76 in a game.`
} as const;
