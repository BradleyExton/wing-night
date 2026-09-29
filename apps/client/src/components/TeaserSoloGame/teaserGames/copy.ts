export const teaserGamesCopy = {
  dunlopDashTitle: "Dunlop Dash",
  dunlopDashPickerBody:
    "Your team skates Dunlop Street as a relay, one leg each. Tap to ollie, hold to go higher, tap in the air to slam down. Land on anything flat, jump anything that isn't, and grab every wing.",
  dunlopDashFinishKicker: "Street clear",
  wings: (wings: number): string => `${wings} wings`,
  fappyBirdTitle: "Fappy Bird",
  fappyBirdPickerBody:
    "Your team flies a relay over downtown Barrie, one leg each. Tap to flap through the gaps, dodge the eagles, and come down on the far roof to hand it on. Beat the clock.",
  fappyFinishKicker: "Through",
  fappyTimedOutKicker: "Time",
  fappyTimedOut: "Out of time",
  slingshlongTitle: "Slingshlong",
  slingshlongPickerBody:
    "Your team takes one shot each off the beach slingshot. Pick what goes on the band, drag back and let go. Topple everyone else off the perches; the higher they stand, the more they are worth.",
  slingshlongFinishKicker: "Turn over",
  slingshlongClearedKicker: "Rack cleared",
  points: (points: number): string => `${points} ${points === 1 ? "point" : "points"}`
} as const;
