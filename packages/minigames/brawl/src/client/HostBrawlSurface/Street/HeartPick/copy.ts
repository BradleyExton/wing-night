export const heartPickCopy = {
  label: "Before you walk",
  buyGlyph: "♥",
  buyTitle: "Buy a heart",
  buyDetail: (heartPrice: number): string => `a 4th heart · costs ${heartPrice} worth`,
  buyBank: (banked: number): string => `· you have ${banked}`,
  keepGlyph: "♥♥♥",
  keepTitle: "Keep the three",
  keepDetail: "or just start walking"
} as const;
