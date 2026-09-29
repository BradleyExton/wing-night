import { useEffect, useState } from "react";

import {
  reconcileStageEmojis,
  resolveFreshHeroKey,
  type StageEmoji
} from "../stageWindow/index.js";
import * as styles from "./styles.js";

export type ClueStageProps = {
  emojiSequence: string[];
  isDimmed: boolean;
};

const resolveGlyphClassName = (entry: StageEmoji, isNewest: boolean): string => {
  if (entry.isLeaving) {
    return styles.glyphLeaving;
  }

  const entranceClassName =
    entry.entrance === "hero" ? styles.glyphHero : styles.glyphSettle;

  return isNewest ? `${entranceClassName} ${styles.glyphHalo}` : entranceClassName;
};

// The TV's clue (DESIGN.md §2.6, "Stage"): the last six emoji, centred, as big
// as the stage allows. Each tap pops up huge in the middle and flies out to the
// end of the row while the rest make room; the seventh sends the first off.
export const ClueStage = ({ emojiSequence, isDimmed }: ClueStageProps): JSX.Element => {
  const sequenceKey = emojiSequence.join("|");
  const [stagedSequenceKey, setStagedSequenceKey] = useState(sequenceKey);
  const [stageEmojis, setStageEmojis] = useState(() =>
    reconcileStageEmojis([], emojiSequence, { isFirstReading: true })
  );
  const [heroRingKey, setHeroRingKey] = useState<string | null>(null);

  // Adjusted during render rather than in an effect, so the row never paints a
  // frame behind the clue it is showing.
  if (stagedSequenceKey !== sequenceKey) {
    const nextStageEmojis = reconcileStageEmojis(stageEmojis, emojiSequence, {
      isFirstReading: false
    });
    const freshHeroKey = resolveFreshHeroKey(stageEmojis, nextStageEmojis);

    setStagedSequenceKey(sequenceKey);
    setStageEmojis(nextStageEmojis);

    if (freshHeroKey !== null) {
      setHeroRingKey(freshHeroKey);
    }
  }

  const hasLeaving = stageEmojis.some((entry) => entry.isLeaving);

  useEffect(() => {
    if (!hasLeaving) {
      return undefined;
    }

    const pruneTimer = setTimeout(() => {
      setStageEmojis((current) => current.filter((entry) => !entry.isLeaving));
    }, styles.STAGE_EXIT_MS);

    return (): void => {
      clearTimeout(pruneTimer);
    };
  }, [hasLeaving, stageEmojis]);

  const onStage = stageEmojis.filter((entry) => !entry.isLeaving);
  const newest = onStage[onStage.length - 1];

  return (
    <div
      className={isDimmed ? `${styles.stage} ${styles.stageDimmed}` : styles.stage}
      data-visible-emoji-count={onStage.length}
    >
      {onStage.length === 0 && !isDimmed && (
        <div className={styles.placeholder} aria-hidden="true">
          <div className={styles.placeholderRing} />
        </div>
      )}
      {heroRingKey !== null && (
        <span key={heroRingKey} className={styles.heroRing} aria-hidden="true" />
      )}
      {stageEmojis.map((entry) => (
        <div
          key={entry.key}
          ref={styles.applyItemGeometry(entry)}
          className={styles.item}
          aria-hidden={entry.isLeaving}
        >
          <span className={resolveGlyphClassName(entry, entry === newest)}>{entry.emoji}</span>
        </div>
      ))}
    </div>
  );
};
