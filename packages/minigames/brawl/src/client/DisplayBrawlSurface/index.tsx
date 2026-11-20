import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { NeonMarquee } from "@wingnight/surface";

import { displayBrawlSurfaceCopy } from "./copy.js";
import { Stage } from "./Stage/index.js";
import * as styles from "./styles.js";

const BrawlIntro = (): JSX.Element => (
  <div className={styles.container}>
    <h2 className={styles.introTitle}>{displayBrawlSurfaceCopy.title}</h2>
    <p className={styles.introDescription}>{displayBrawlSurfaceCopy.introDescription}</p>
  </div>
);

// BRAWL's display surface (docs/minigames/brawl-crew-spec.md §0.7, DESIGN.md §2.14): the briefing
// before the fight, and at play the wall's stage — the house `<NeonMarquee>` with the crew in it
// over the crew's street (`Stage`). The TV is the one picture and the only speaker.
export const DisplayBrawlSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  clock,
  clockLine,
  serverOrigin,
  handset
}: MinigameDisplayRendererProps): JSX.Element => {
  const brawlView = minigameDisplayView?.minigame === "BRAWL" ? minigameDisplayView : null;

  if (phase !== "play") {
    return <BrawlIntro />;
  }

  if (brawlView === null) {
    return (
      <div className={styles.stage}>
        <NeonMarquee title={displayBrawlSurfaceCopy.title} teamName={activeTeamName} clock={clock} clockLine={clockLine} />
        <div className={styles.container}>
          <p className={styles.hint}>{displayBrawlSurfaceCopy.waitingStreetLabel}</p>
        </div>
      </div>
    );
  }

  return <Stage view={brawlView} activeTeamName={activeTeamName} clock={clock} clockLine={clockLine} serverOrigin={serverOrigin} handset={handset} />;
};
