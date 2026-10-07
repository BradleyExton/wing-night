import type { ContestantController } from "@wingnight/shared";
import { ResultPlaque } from "@wingnight/surface";

import type { RunHold } from "../../useHeldRun/index.js";
import { displaySchlonicSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

// The beat over a run that just ended: how it went, and — when the tablet is changing hands —
// who takes it. One card, the house `<ResultPlaque>` (DESIGN.md §2.2E), with who is next under
// its rule. A skipped run has no ending to show, so on a handoff the card is only the name, and
// on a finish there is no card at all: the points plaque follows.
// Every plaque here is `silent`: the board's own cues (post, fall, wipeout, handoff, finish) sound
// these moments when the wall shows them, and the house sting on top would be a second voice.
export const HoldPlaque = ({
  hold,
  nextName,
  handset
}: {
  hold: RunHold;
  nextName: string | null;
  handset: ContestantController;
}): JSX.Element | null => {
  const { outcome } = hold;
  const showsNext = hold.kind === "handoff";

  // A skipped run is not a wipeout: the card names who is next and says nothing about how it
  // went — and a skipped run that hands nothing on has no card at all.
  if (outcome === "skipped") {
    if (!showsNext) {
      return null;
    }

    return (
      <div className={styles.resultOverlay} data-schlonic-outcome={hold.outcome}>
        <ResultPlaque
          tone="neutral"
          silent
          kicker={displaySchlonicSurfaceCopy.handoffCalloutLine(handset)}
          title={displaySchlonicSurfaceCopy.handoffCalloutName(nextName)}
        />
      </div>
    );
  }

  const handoff = showsNext ? (
    <div className={styles.handoff} data-schlonic-handoff="display">
      <span className={styles.handoffName}>
        {displaySchlonicSurfaceCopy.handoffCalloutName(nextName)}
      </span>
      <span className={styles.handoffLine}>{displaySchlonicSurfaceCopy.handoffCalloutLine(handset)}</span>
    </div>
  ) : null;

  return (
    <div className={styles.resultOverlay} data-schlonic-outcome={hold.outcome}>
      <ResultPlaque
        tone={outcome === "cleared" ? "hit" : "miss"}
        silent
        title={displaySchlonicSurfaceCopy.outcomeTitle(outcome)}
        detail={displaySchlonicSurfaceCopy.outcomeBlurb(outcome, hold.wings)}
      >
        {handoff}
      </ResultPlaque>
    </div>
  );
};
