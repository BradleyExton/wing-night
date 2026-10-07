import type { MinigameHandset } from "@wingnight/minigames-core";

import type { BlockHold } from "../../useHeldBlock/index.js";
import { beatCalloutCopy } from "./copy.js";
import * as styles from "./styles.js";

type BeatCalloutProps = {
  hold: BlockHold;
  /** Who takes the tablet next; only read when the hold hands it on. */
  nextName: string | null;
  /** Who plays the next block: "Hand it to" is the tablet's line; a phone's is "your phone is live". */
  handset: MinigameHandset;
};

// "HAND IT TO …" in the show's voice, on the block's own terms: big when the hen made the handoff,
// a size down under INTO THE BAY or TIME when she did not.
const Handoff = ({
  nextName,
  isMain,
  handset
}: {
  nextName: string | null;
  isMain: boolean;
  handset: MinigameHandset;
}): JSX.Element =>
  isMain ? (
    <>
      <span className={styles.lead}>{beatCalloutCopy.handoffLead(handset)}</span>
      <p className={styles.line} data-brawl-handoff-callout="display">
        {beatCalloutCopy.handoffName(nextName)}
      </p>
    </>
  ) : (
    <span className={styles.handoffAfter} data-brawl-handoff-callout="display">
      <span className={styles.lead}>{beatCalloutCopy.handoffLead(handset)}</span>
      <span className={styles.handoffAfterName}>{beatCalloutCopy.handoffName(nextName)}</span>
    </span>
  );

// The words over a block's ending beat on the wall (docs/minigames/brawl-spec.md §0.7): the handoff
// on a cleared block, the bay on a KO, the bell on a timeout — and, whenever the tablet is changing
// hands, who takes it. A skipped block has no ending to show, only who is next.
export const BeatCallout = ({ hold, nextName, handset }: BeatCalloutProps): JSX.Element | null => {
  const handsOn = hold.kind === "handoff";

  if (hold.outcome === "skipped") {
    return handsOn ? (
      <div className={styles.overlay} data-brawl-beat-callout="skipped">
        <Handoff nextName={nextName} isMain handset={handset} />
      </div>
    ) : null;
  }

  if (hold.outcome === "cleared") {
    return (
      <div className={styles.overlay} data-brawl-beat-callout="cleared">
        {handsOn ? (
          <Handoff nextName={nextName} isMain handset={handset} />
        ) : (
          <>
            <span className={styles.lead}>{beatCalloutCopy.clearedLastLead}</span>
            <p className={styles.line}>{beatCalloutCopy.clearedLastLine}</p>
          </>
        )}
      </div>
    );
  }

  const isBay = hold.outcome === "ko";

  return (
    <div className={styles.overlay} data-brawl-beat-callout={hold.outcome}>
      <p className={isBay ? styles.lineBay : styles.line} data-brawl-beat-line={isBay ? "bay" : "bell"}>
        {isBay ? beatCalloutCopy.bayLine : beatCalloutCopy.bellLine}
      </p>
      {handsOn && <Handoff nextName={nextName} isMain={false} handset={handset} />}
    </div>
  );
};
