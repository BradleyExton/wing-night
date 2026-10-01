import type { RefObject } from "react";
import type { BrawlMinigameDisplayView } from "@wingnight/shared";
import { BRAWL_WORLD } from "@wingnight/shared";

import { marqueeReadoutCopy } from "./copy.js";
import * as styles from "./styles.js";

const HEART_SLOTS = Array.from({ length: BRAWL_WORLD.heartsMax }, (_unused, index) => index);

type MarqueeReadoutProps = {
  view: BrawlMinigameDisplayView;
  /** The block the WALL is showing, which lags the tablet through a handoff. */
  shownBlockIndex: number;
  /** What the turn banked before the shown block: the floor the live tally counts up from. */
  goonsBanked: number;
  /** Written by the mirror's paint loop, sixty times a second. */
  heartsRef: RefObject<HTMLSpanElement>;
  tallyRef: RefObject<HTMLSpanElement>;
};

// What the room reads off the sign while a block is fought (docs/minigames/brawl-spec.md §0.7):
// whose block it is, the hearts she has left, the worth down over the course and, once the round
// has one, the number to beat. The hearts and the tally are the replay's, not the view's — the
// view only banks a block once it is refereed, and the room is watching it now.
export const MarqueeReadout = ({
  view,
  shownBlockIndex,
  goonsBanked,
  heartsRef,
  tallyRef
}: MarqueeReadoutProps): JSX.Element => {
  const isFinished = view.phase === "finished";
  const playerName = view.blocks[shownBlockIndex]?.player?.name ?? null;

  return (
    <>
      <span>
        {marqueeReadoutCopy.blockCounter(shownBlockIndex + 1, view.blocksPerTurn)}
        {playerName !== null && !isFinished && (
          <>
            {marqueeReadoutCopy.blockNameSeparator}
            <span className={styles.blockName} data-brawl-block-name>
              {playerName}
            </span>
          </>
        )}
      </span>
      {!isFinished && (
        <>
          <span ref={heartsRef} className={styles.hearts} data-brawl-hearts={BRAWL_WORLD.heartsMax}>
            {HEART_SLOTS.map((slot) => (
              <span key={slot} className={styles.heart} data-lit="true">
                {marqueeReadoutCopy.heart}
              </span>
            ))}
          </span>
          <span>{marqueeReadoutCopy.heartsLabel}</span>
        </>
      )}
      <span ref={tallyRef} className={styles.goons} data-brawl-goons>
        {marqueeReadoutCopy.goonsTally(isFinished ? view.goonsDown : goonsBanked, view.goonsTotal)}
      </span>
      <span>{marqueeReadoutCopy.goonsLabel}</span>
      {view.bestTurn !== null && (
        <>
          <span className={styles.best} data-brawl-best>
            {marqueeReadoutCopy.bestGoons(view.bestTurn.goons)}
          </span>
          <span>{marqueeReadoutCopy.bestLabel(view.bestTurn.teamName)}</span>
        </>
      )}
    </>
  );
};
