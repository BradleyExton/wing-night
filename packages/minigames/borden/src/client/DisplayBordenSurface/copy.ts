export const displayBordenSurfaceCopy = {
  title: "Base Borden",
  introDescription: "Two at a time through the base, spraying hot sauce. Jump the low shots, duck the high ones, and hand over at the gate.",
  waitingBaseLabel: "The base is loading.",
  sceneLabel: "Base Borden",
  stretchCounter: (stretchNumber: number, stretchesTotal: number): string => `Stretch ${stretchNumber} of ${stretchesTotal}`,
  tally: (banked: number, total: number): string => `${banked} / ${total}`,
  tallyLabel: "Worth"
} as const;
