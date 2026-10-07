export const playerIdleCardCopy = {
  eyebrow: "You're in",
  noTeam: "Not on a team yet",
  watchTheTv: "Eyes on the TV. The host will call you up.",
  notMe: "This isn't me",
  confirmQuestion: (name: string): string => `Let go of ${name}'s face?`,
  confirmRelease: "Yes, let go",
  keepFace: "Keep it"
} as const;
