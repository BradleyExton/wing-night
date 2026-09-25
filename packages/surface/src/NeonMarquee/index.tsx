import type { ReactNode } from "react";

import { neonMarqueeCopy } from "./copy.js";
import * as styles from "./styles.js";

export type NeonMarqueeProps = {
  // The show's name, as the neon kicker over the team.
  title: string;
  teamName: string | null;
  // The active team's pending points, lit in gold beside the name. A number,
  // not copy: the sign words it ("+3 pending") the same way on every game —
  // it used to read "+0 PENDING" on two and a bare "+0" on two more.
  pending?: number | null;
  // The turn's live counts — "Photo 2 of 3", "Shot 2 of 5", the wing tally —
  // right-aligned, left of the clock. Read-only, the same rule as the host
  // rail's `counter` slot (docs/takeover-layout-api.md §4). The sign sets the
  // label type, so a game passes plain text; a live number that has to read
  // bigger than its label wears `readoutFigure`.
  readout?: ReactNode;
  // Both from the shell, both possibly null: the digits pill sits at the end
  // of the meta row, the lit length sits in the track under the row.
  clock: ReactNode;
  clockLine: ReactNode;
};

// The one TV marquee every minigame wears (DESIGN.md §2.2D). Eight surfaces
// used to carry their own copy of a gold-bordered bulb marquee, differing only
// in padding and background — the drift the shared text tokens could not stop
// because the CONTAINER was the thing being copied. This is the container.
// It takes content, never a class string: a game changes what the marquee
// says, not how it looks.
//
// A `<div>`, not a `<header>`: `page.locator("header")` is the e2e suite's
// strict handle on the host's mini-rail, and the dev sandbox renders the host
// and the display previews on one page.
export const NeonMarquee = ({
  title,
  teamName,
  pending,
  readout,
  clock,
  clockLine
}: NeonMarqueeProps): JSX.Element => (
  <div className={styles.marquee} data-neon-marquee>
    <div className={styles.row}>
      <div className={styles.lead}>
        <p className={styles.kicker}>{title}</p>
        <p className={styles.team}>
          <span className={styles.teamName}>{teamName ?? ""}</span>
          {pending !== undefined && pending !== null && (
            <span className={styles.pending}>
              {neonMarqueeCopy.pendingValue(pending)}{" "}
              <span className={styles.pendingLabel}>{neonMarqueeCopy.pendingLabel}</span>
            </span>
          )}
        </p>
      </div>
      <div className={styles.meta}>
        {readout !== undefined && readout !== null && readout !== false && (
          <div className={styles.readout}>{readout}</div>
        )}
        {clock}
      </div>
    </div>
    <div className={styles.track}>{clockLine}</div>
  </div>
);
