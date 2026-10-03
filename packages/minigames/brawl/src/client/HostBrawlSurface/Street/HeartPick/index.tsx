import { heartPickCopy } from "./copy.js";
import * as styles from "./styles.js";

type HeartPickProps = {
  /** What the heart costs in banked worth (the `heartPrice` rule). */
  heartPrice: number;
  /** The team's banked worth now, after any heart it already bought. */
  banked: number;
  onBuy: () => void;
  onKeep: () => void;
};

/**
 * The handoff pick (docs/minigames/brawl-spec.md §0.6): two cards over the street while a block
 * after the first is on the line and the team can pay — spend banked worth on a fourth heart, or
 * keep the three. Keeping them is the default and needs no tap: the first thumb on the street
 * closes the cards. The cards are buttons; the layer under them lets every other touch through.
 */
export const HeartPick = ({ heartPrice, banked, onBuy, onKeep }: HeartPickProps): JSX.Element => (
  <div className={styles.overlay} data-brawl-heart-pick>
    <span className={styles.label}>{heartPickCopy.label}</span>
    <div className={styles.cards}>
      <button type="button" className={styles.buyCard} data-brawl-heart-pick-choice="buy" onClick={onBuy}>
        <span className={styles.glyph} aria-hidden="true">
          {heartPickCopy.buyGlyph}
        </span>
        <span className={styles.title}>{heartPickCopy.buyTitle}</span>
        <span className={styles.detail}>
          {heartPickCopy.buyDetail(heartPrice)} <span className={styles.detailBank}>{heartPickCopy.buyBank(banked)}</span>
        </span>
      </button>
      <button type="button" className={styles.keepCard} data-brawl-heart-pick-choice="keep" onClick={onKeep}>
        <span className={styles.keepGlyph} aria-hidden="true">
          {heartPickCopy.keepGlyph}
        </span>
        <span className={styles.title}>{heartPickCopy.keepTitle}</span>
        <span className={styles.detail}>{heartPickCopy.keepDetail}</span>
      </button>
    </div>
  </div>
);
