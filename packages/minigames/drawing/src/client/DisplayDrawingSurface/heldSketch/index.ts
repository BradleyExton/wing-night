import type { DrawingPromptReveal, DrawingStroke } from "@wingnight/shared";

export type HeldSketch = {
  revealKey: string;
  strokes: DrawingStroke[];
};

// Two reveals of the same prompt (a repeat later in the turn) are different
// moments, so the revealed-at stamp is part of the identity.
export const resolveRevealKey = (
  reveal: DrawingPromptReveal | null
): string | null => {
  return reveal === null ? null : `${reveal.promptId}:${reveal.revealedAtMs}`;
};

// The runtime wipes the canvas in the same update that raises the reveal, so
// the sketch the TV lingers on is whatever stood on the board the render
// before. Pinning it to the reveal that caught it is what stops a prompt
// resolved on a blank board — the host cleared, or nobody drew at all — from
// resurrecting the previous prompt's drawing under the new plaque.
export const resolveHeldSketch = ({
  heldSketch,
  revealKey,
  strokes,
  previousStrokes
}: {
  heldSketch: HeldSketch | null;
  revealKey: string | null;
  strokes: DrawingStroke[];
  previousStrokes: DrawingStroke[];
}): HeldSketch | null => {
  if (revealKey === null) {
    return null;
  }

  if (heldSketch !== null && heldSketch.revealKey === revealKey) {
    return heldSketch;
  }

  return {
    revealKey,
    strokes: strokes.length > 0 ? strokes : previousStrokes
  };
};
