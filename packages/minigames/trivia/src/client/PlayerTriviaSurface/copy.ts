// A playing-team phone's TRIVIA card (mockups/phone-answers, frames 3–4).
export const playerTriviaSurfaceCopy = {
  eyebrow: "Trivia · Pick one",
  lockedEyebrow: "Trivia",
  letter: (index: number): string => String.fromCharCode(65 + index),
  openVoice: (hasChosen: boolean): string =>
    hasChosen ? "Change your mind till the host locks it." : "Tap your answer. You can change it till the host locks it.",
  spokenEyebrow: "Trivia · Out loud",
  spokenTitle: "Say it to your team",
  spokenVoice: "No choices on this one — the host is judging it aloud.",
  wonStamp: "✓ You got it",
  lostStamp: "✗ Not this time",
  lockedTitle: "Locked in",
  noAnswerTitle: "No answer",
  noAnswerVoice: "No pick from you on this one.",
  watchTheTv: "Watch the TV."
} as const;
