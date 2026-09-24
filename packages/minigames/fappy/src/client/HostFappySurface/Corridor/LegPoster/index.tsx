import { PlayerHead } from "../../../PlayerHead/index.js";
import type { LegBird } from "../../../resolveLegBird/index.js";
import { legPosterCopy } from "./copy.js";
import * as styles from "./styles.js";

// Whose tablet it is, on the arena that is not moving yet: the flyer's face,
// their name at poster size, and the one instruction. It goes the instant the
// bird takes off — the corridor is the only thing worth looking at from then
// on — and it never takes a tap.
export const LegPoster = ({ bird, isRespawn }: { bird: LegBird; isRespawn: boolean }): JSX.Element => (
  <div
    className={`${isRespawn ? styles.overlayRespawn : styles.overlay} ${bird.fillClassName}`}
    data-fappy-leg-poster={isRespawn ? "respawn" : "start"}
  >
    <span className={styles.head}>
      <PlayerHead bird={bird} />
    </span>
    <span className={styles.kicker}>{legPosterCopy.kicker}</span>
    <span className={styles.name}>{legPosterCopy.name(bird.playerName)}</span>
    <span className={styles.prompt}>{legPosterCopy.prompt(isRespawn)}</span>
  </div>
);
