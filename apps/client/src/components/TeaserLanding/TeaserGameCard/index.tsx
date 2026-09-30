import type { MinigameType } from "@wingnight/shared";

import { RoundGlyph } from "../../DisplayBoard/StageSurface/SetupStageBody/RoundGlyph";
import * as styles from "./styles";

type TeaserGameCardProps = {
  minigame: MinigameType;
  title: string;
  summary: string;
  // Where the card goes, or null for a game that is not playable yet.
  href: string | null;
  statusLabel: string;
};

// One game on the landing page, cut from the lobby's round card into a row: the game's symbol
// in a lit badge, its name as the headline with a line of what you do under it, and the pill
// that says whether you can play it.
export const TeaserGameCard = ({
  minigame,
  title,
  summary,
  href,
  statusLabel
}: TeaserGameCardProps): JSX.Element => {
  const isLocked = href === null;
  const body = (
    <>
      <span className={isLocked ? styles.badgeLocked : styles.badge} aria-hidden>
        <RoundGlyph minigame={minigame} variant="badge" />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={styles.summary}>{summary}</span>
      </span>
      <span className={isLocked ? styles.pillLocked : styles.pill}>
        <span className={isLocked ? styles.pillDotLocked : styles.pillDot} aria-hidden />
        {statusLabel}
      </span>
    </>
  );

  return href === null ? (
    <div className={styles.cardLocked}>{body}</div>
  ) : (
    <a className={styles.card} href={href}>
      {body}
    </a>
  );
};
