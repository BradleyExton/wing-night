export const loadoutCopy = {
  label: "Loadout",
  unlimitedLabel: "any time",
  usesLeftLabel: (usesLeft: number): string => (usesLeft === 1 ? "1 left" : `${usesLeft} left`),
  spentLabel: "spent",
  pickLabel: (name: string, blurb: string): string => `${name} — ${blurb}`
} as const;
