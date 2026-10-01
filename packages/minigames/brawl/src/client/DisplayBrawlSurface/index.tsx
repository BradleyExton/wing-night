import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { NeonMarquee } from "@wingnight/surface";

import { displayBrawlSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const BrawlIntro = (): JSX.Element => (
  <div className={styles.container}>
    <h2 className={styles.introTitle}>{displayBrawlSurfaceCopy.title}</h2>
    <p className={styles.introDescription}>{displayBrawlSurfaceCopy.introDescription}</p>
  </div>
);

// BRAWL's display surface: the house `<NeonMarquee>` with the shell's `clock` and `clockLine`
// seated, over the arena the street will fill.
//
// A placeholder: the mirror, the marquee's readout and the beats land with the surface build
// (docs/minigames/brawl-spec.md §0.7).
export const DisplayBrawlSurface = ({
  phase,
  activeTeamName,
  clock,
  clockLine
}: MinigameDisplayRendererProps): JSX.Element => {
  if (phase !== "play") {
    return <BrawlIntro />;
  }

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={displayBrawlSurfaceCopy.title}
        teamName={activeTeamName}
        clock={clock}
        clockLine={clockLine}
      />
      <div className={styles.arenaArea} data-brawl-placeholder="display">
        <p className={styles.statusLine}>{displayBrawlSurfaceCopy.waitingStreetLabel}</p>
      </div>
    </div>
  );
};
