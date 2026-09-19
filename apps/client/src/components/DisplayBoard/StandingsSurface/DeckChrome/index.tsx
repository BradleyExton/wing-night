import * as styles from "./styles";

/**
 * The standings band is not a footer bar — it is the floor the lobby cast
 * walks and dances on (DESIGN.md §2.2C), so it is built as a physical slab:
 * a lit front lip, a tread and its nosing, the hearth's wash across its face,
 * one sheen tying every bay into a single surface, and a shaded plinth foot.
 *
 * Pure depth cue, the same trade JOUST's `GroundShadow` makes (§2.7): no
 * layout, no data, `aria-hidden`. The team bays paint their own faces between
 * these layers, which is why the z-indexes are explicit rather than DOM order.
 */
export const DeckChrome = (): JSX.Element => {
  return (
    <span className={styles.frame} aria-hidden data-deck-chrome>
      <span className={styles.wash} />
      <span className={styles.sheen} />
      <span className={styles.tread} />
      <span className={styles.nosing} />
      <span className={styles.lip} />
      <span className={styles.plinth} />
    </span>
  );
};
