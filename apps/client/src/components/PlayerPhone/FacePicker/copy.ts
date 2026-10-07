import { PLAYER_CLAIM_REFUSAL_REASONS, type PlayerClaimRefusalReason } from "@wingnight/shared";

export const facePickerCopy = {
  eyebrow: "Tonight's roster",
  title: "Tap your face.",
  taken: "Taken",
  claimLabel: (name: string): string => `I'm ${name}`,
  takenLabel: (name: string): string => `${name} is taken`,
  emptyRoster: "The host hasn't loaded tonight's roster yet. Hang tight.",
  hint: "Someone already took yours? Tell the host — they can free it from the tablet.",
  refusal: (reason: PlayerClaimRefusalReason): string => {
    if (reason === PLAYER_CLAIM_REFUSAL_REASONS.ALREADY_CLAIMED) {
      return "Someone just took that face. If it's yours, tell the host — they can free it.";
    }

    if (reason === PLAYER_CLAIM_REFUSAL_REASONS.RATE_LIMITED) {
      return "Easy — one tap at a time. Try again in a second.";
    }

    return "That face isn't on tonight's roster any more.";
  }
} as const;
