export const mountSceneCopy = {
  // The line's holder while nobody has beaten the goose.
  gooseHolder: "The goose",
  // A pile hen whose player has left the roster still holds the line by name of nobody.
  unknownHolder: "A hen",
  lineHeight: (hens: string): string => `${hens} hens up`,
  // The tablet's arrow on the top edge when the line is above the close-up. The number is the
  // gap from the climber's crown to the line, not the line's height, so it must not read like
  // `lineHeight` ("2.2 hens up") or the two disagree on the same screen.
  lineAbove: (hens: string): string => `▲ ${hens} hens to the line`
} as const;
