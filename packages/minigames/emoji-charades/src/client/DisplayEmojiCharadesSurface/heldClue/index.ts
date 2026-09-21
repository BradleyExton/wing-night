import type { EmojiCharadesSubjectReveal } from "@wingnight/shared";

export type HeldClue = {
  revealKey: string;
  emojiSequence: string[];
};

// Two verdicts on the same subject (a repeat later in the turn) are different
// moments, so the revealed-at stamp is part of the identity.
export const resolveRevealKey = (
  reveal: EmojiCharadesSubjectReveal | null
): string | null => {
  return reveal === null ? null : `${reveal.subjectId}:${reveal.revealedAtMs}`;
};

// The runtime empties the clue in the same update that raises the reveal, so
// the board the TV dims behind the answer is whatever stood on it the render
// before — otherwise the room loses the clue at the exact moment it would
// finally make sense of it. The same hold DRAWING keeps for its sketch.
// Pinning it to the reveal that caught it is what stops a subject resolved on
// an empty board from resurrecting the previous subject's clue.
export const resolveHeldClue = ({
  heldClue,
  revealKey,
  emojiSequence,
  previousEmojiSequence
}: {
  heldClue: HeldClue | null;
  revealKey: string | null;
  emojiSequence: string[];
  previousEmojiSequence: string[];
}): HeldClue | null => {
  if (revealKey === null) {
    return null;
  }

  if (heldClue !== null && heldClue.revealKey === revealKey) {
    return heldClue;
  }

  return {
    revealKey,
    emojiSequence:
      emojiSequence.length > 0 ? emojiSequence : previousEmojiSequence
  };
};
