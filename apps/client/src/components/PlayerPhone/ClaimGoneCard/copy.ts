import { PLAYER_CLAIM_GONE_REASONS, type PlayerClaimGoneReason } from "@wingnight/shared";

type ClaimGoneLines = {
  title: string;
  voice: string;
};

const LINES_BY_REASON: Record<PlayerClaimGoneReason, ClaimGoneLines> = {
  [PLAYER_CLAIM_GONE_REASONS.RELEASED_BY_HOST]: {
    title: "The host freed your face.",
    voice: "Pick it again, or pick the right one."
  },
  [PLAYER_CLAIM_GONE_REASONS.ROSTER_CHANGED]: {
    title: "The roster changed.",
    voice: "Find your face on the new one."
  },
  [PLAYER_CLAIM_GONE_REASONS.SUPERSEDED]: {
    title: "You're playing on another screen.",
    voice: "Your face moved to another tab or phone."
  },
  [PLAYER_CLAIM_GONE_REASONS.RELEASED_ELSEWHERE]: {
    title: "Your face was let go on another screen.",
    voice: "Pick it again here if that was a mistake."
  },
  [PLAYER_CLAIM_GONE_REASONS.ANOTHER_FACE]: {
    title: "This phone picked another face.",
    voice: "One face per phone. Pick again if that wasn't you."
  },
  [PLAYER_CLAIM_GONE_REASONS.CLAIM_NOT_FOUND]: {
    title: "Your face was freed while your phone slept.",
    voice: "Pick it again to jump back in."
  },
  // Never shown — a reset sends the phone to "scan the TV" instead — but the
  // table stays total so a new reason cannot fall through to nothing.
  [PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET]: {
    title: "The night was reset.",
    voice: "Scan the new code on the TV."
  }
};

export const claimGoneCardCopy = {
  eyebrow: "Face freed",
  lines: (reason: PlayerClaimGoneReason): ClaimGoneLines => LINES_BY_REASON[reason],
  pickAgain: "Pick your face",
  playHere: "Play on this phone"
} as const;
