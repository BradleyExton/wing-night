import { heartCalloutCopy } from "./copy.js";
import * as styles from "./styles.js";

type HeartCalloutProps = {
  /** Who bought it: the block's player. */
  playerName: string | null;
  heartPrice: number;
};

// The wall's word on the handoff pick (docs/minigames/brawl-spec.md §0.7): the block on the line
// starts on a heart the team bought, and the tally just dropped by its price. Client-only, for
// about two seconds (`useHeartCallout`); the TV never shows the cards themselves.
export const HeartCallout = ({ playerName, heartPrice }: HeartCalloutProps): JSX.Element => (
  <div className={styles.overlay} data-brawl-heart-callout>
    <span className={styles.lead}>{heartCalloutCopy.lead(heartPrice)}</span>
    <p className={styles.line}>
      <span className={styles.name}>{heartCalloutCopy.name(playerName)}</span>
      <span className={styles.verb}>{heartCalloutCopy.line}</span>
    </p>
  </div>
);
