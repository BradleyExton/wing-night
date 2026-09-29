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

// One game on the landing page, cut from the lobby's round card: the game's embossed glyph, its
// name as the headline, a line of what you do, and the pill that says whether you can play it.
export const TeaserGameCard = ({
  minigame,
  title,
  summary,
  href,
  statusLabel
}: TeaserGameCardProps): JSX.Element => {
  const body = (
    <>
      <RoundGlyph minigame={minigame} />
      <p className={styles.title}>{title}</p>
      <p className={styles.summary}>{summary}</p>
      <span className={href === null ? styles.pillLocked : styles.pill}>
        <span className={href === null ? styles.pillDotLocked : styles.pillDot} aria-hidden />
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
