export const contestantGameCopy = {
  railLabel: (playerName: string): string => `${playerName}'s leg`,
  waitingForLeg: "Getting your leg ready…",
  // The handoff hold: the one beat between being next and playing, said over the game.
  holdEyebrow: (previousName: string | null): string =>
    previousName === null ? "You're first" : `${previousName} is through`,
  holdTitle: "Your leg",
  holdVoice: "Tap when you're ready."
} as const;
