import type { BrawlCrewOutcome } from "@wingnight/shared";

import type { BrawlSetting } from "../../CrewScene/Backdrop/index.js";
import { beatCalloutCopy } from "./copy.js";
import * as styles from "./styles.js";

type BeatCalloutProps = {
  outcome: BrawlCrewOutcome;
  /** The stretch of Barrie the block was fought on. */
  setting: BrawlSetting;
  /** The stretch the next block is on, or null when this was the last. */
  next: BrawlSetting | null;
  /** Whether the next block is the tablet's own (one hen, the host's Start) rather than the crew's. */
  nextOnTablet: boolean;
};

/**
 * The words over a block's ending on the wall (docs/minigames/brawl-crew-spec.md §0.7): block
 * clear, the bay when every hen went down at once, the bell when the block's clock ran out — and
 * under them where the street goes next, and that the first thumb starts it. They hang low over
 * the pavement on a dark pool, because every beat ends on the hens and the words must not take
 * them.
 */
export const BeatCallout = ({ outcome, setting, next, nextOnTablet }: BeatCalloutProps): JSX.Element => (
  <div className={styles.overlay} data-brawl-beat-callout={outcome}>
    <span className={styles.lead}>{next === null && outcome === "cleared" ? beatCalloutCopy.lastLead : beatCalloutCopy.lead[outcome](beatCalloutCopy.setting[setting])}</span>
    <p className={outcome === "wipe" ? styles.lineBay : styles.line} data-brawl-beat-line={outcome}>
      {next === null && outcome === "cleared" ? beatCalloutCopy.lastLine : beatCalloutCopy.line[outcome]}
    </p>
    {next !== null && (
      <span className={styles.next} data-brawl-beat-next>
        {beatCalloutCopy.next(beatCalloutCopy.settingNext[next], nextOnTablet)}
      </span>
    )}
  </div>
);
