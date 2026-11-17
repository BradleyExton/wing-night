import type { BrawlPlayerFigure } from "@wingnight/shared";

import { CrewHead } from "../CrewHead/index.js";
import { resolveHenFigure } from "../resolveHenFigure/index.js";
import { turnAwardsCopy } from "./copy.js";
import type { TurnAward } from "./resolveTurnAwards/index.js";
import * as styles from "./styles.js";

type TurnAwardsProps = {
  awards: readonly TurnAward[];
  activeTurnTeamId: string | null;
  serverOrigin: string | null;
  /** The wall's card, or the tablet's readout beside the running totals. */
  tone: "wall" | "tablet";
};

const Winner = ({ figure, activeTurnTeamId, serverOrigin }: { figure: BrawlPlayerFigure; activeTurnTeamId: string | null; serverOrigin: string | null }): JSX.Element => (
  <span className={styles.winner}>
    <span className={styles.head}>
      <CrewHead figure={resolveHenFigure({ figure, activeTurnTeamId, serverOrigin })} />
    </span>
    <span className={styles.name}>{figure.name}</span>
  </span>
);

/**
 * The turn's own numbers, as names (docs/minigames/brawl-crew-spec.md §1 item 24): who put down
 * the most geese, who got the most teammates back up, and who the geese carried most often. The
 * reveal the room reacts to — every row is somebody in it. Nothing at all for a turn with
 * nothing to name.
 */
export const TurnAwards = ({ awards, activeTurnTeamId, serverOrigin, tone }: TurnAwardsProps): JSX.Element | null => {
  if (awards.length === 0) {
    return null;
  }

  return (
    <ul className={tone === "wall" ? styles.listWall : styles.listTablet} data-brawl-awards={awards.length}>
      {awards.map((award) => (
        <li key={award.kind} className={styles.row} data-brawl-award={award.kind}>
          <span className={styles.label}>{turnAwardsCopy.label[award.kind]}</span>
          <span className={styles.winners}>
            {award.winners.map((figure) => (
              <Winner key={figure.playerId} figure={figure} activeTurnTeamId={activeTurnTeamId} serverOrigin={serverOrigin} />
            ))}
          </span>
          <span className={styles.value}>{turnAwardsCopy.value[award.kind](award.value)}</span>
        </li>
      ))}
    </ul>
  );
};
