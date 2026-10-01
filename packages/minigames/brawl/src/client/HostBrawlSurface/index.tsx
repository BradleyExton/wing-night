import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import { TakeoverCanvas } from "@wingnight/surface";

import { hostBrawlSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// BRAWL's host surface. At play it is a `<TakeoverCanvas>` (docs/takeover-layout-api.md §3,
// §5): the street is evenly spread scenery. `rail` and `clock` are forwarded untouched — the
// shell's `<HostMiniRail />` already says the round, the sauce and whose turn it is.
//
// A placeholder: the street, the two thumb zones and the turn's chrome land with the surface
// build (docs/minigames/brawl-spec.md §0.6).
export const HostBrawlSurface = ({ phase, rail, clock }: MinigameHostRendererProps): JSX.Element => {
  // The intro is a panel in the host's own control deck rather than a takeover — `rail` and
  // `clock` are both null on it — so it gets the briefing note instead.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>{hostBrawlSurfaceCopy.introDescription}</p>
      </div>
    );
  }

  return (
    <TakeoverCanvas rail={rail} clock={clock}>
      <p className={styles.waitingNote} data-brawl-placeholder="host">
        {hostBrawlSurfaceCopy.waitingStreetLabel}
      </p>
    </TakeoverCanvas>
  );
};
