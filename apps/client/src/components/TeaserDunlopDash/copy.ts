export const teaserDunlopDashCopy = {
  title: "Dunlop Dash",
  backLabel: "Wing Night",
  rotateTitle: "Turn your phone sideways",
  rotateBody: "Dunlop Street runs left to right.",
  pickerKicker: "Dunlop Dash",
  pickerTitle: "Pick your team",
  pickerBody:
    "Your team skates Dunlop Street as a relay, one leg each. Tap to ollie, hold to go higher, tap in the air to slam down. Land on anything flat, jump anything that isn't, and grab every wing.",
  finishKicker: "Street clear",
  finishWings: (wings: number): string => `${wings} wings`,
  finishBest: (wings: number): string => `Best on this phone: ${wings}`,
  finishNewBest: "New best. Your ghost rides next time.",
  runAgainLabel: "Run it back",
  switchTeamLabel: "Switch team",
  homeLabel: "Home"
} as const;
