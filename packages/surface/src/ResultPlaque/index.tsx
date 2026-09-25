import type { ReactNode } from "react";

import { revealPoints } from "../styleTokens/index.js";
import { resultPlaqueCopy } from "./copy.js";
import * as styles from "./styles.js";

export type ResultPlaqueTone = "hit" | "miss" | "neutral";

export type ResultPlaqueProps = {
  // How it went. `hit` and `miss` carry a ✓ / ✗ as well as their colour, so the
  // room never reads a result from colour alone; `neutral` is a result that is
  // neither (a split ruling, a finish with nothing to celebrate or mourn).
  tone: ResultPlaqueTone;
  // The small line over the title: "The answer was", "Off by".
  kicker?: string | null;
  // The headline: "3 down!", "Campfire", "Relay over".
  title: string;
  // The line under it: who went over, the time, the artist.
  detail?: ReactNode;
  // The points this result banked, already formatted ("+3"), in the house
  // `revealPoints` face. Absent when the result banked nothing worth saying.
  points?: string | null;
  // Under the points: the team, or the unit.
  pointsCaption?: string | null;
  // Whatever follows the result on the same card, under a rule.
  children?: ReactNode;
};

const PLAQUE_BY_TONE = {
  hit: styles.plaqueHit,
  miss: styles.plaqueMiss,
  neutral: styles.plaqueNeutral
} as const;

const KICKER_BY_TONE = {
  hit: styles.kickerHit,
  miss: styles.kickerMiss,
  neutral: styles.kickerNeutral
} as const;

// The TV's one result card (DESIGN.md §2.2E). Six treatments had grown across the
// nine games — a gold cabinet plaque copied byte for byte between JOUST and FAPPY,
// a drifted copy of it in SCHLONIC, two verdict plaques, hit/miss chips, a
// rotated rubber stamp and stat tiles. Like `NeonMarquee` it takes content and
// never a class string: the game decides where the card sits and hangs its own
// `data-*` hook on the wrapper it places it in.
export const ResultPlaque = ({
  tone,
  kicker = null,
  title,
  detail,
  points = null,
  pointsCaption = null,
  children
}: ResultPlaqueProps): JSX.Element => {
  return (
    <div className={PLAQUE_BY_TONE[tone]} data-result-plaque={tone}>
      {tone !== "neutral" && (
        <span className={tone === "hit" ? styles.glyphHit : styles.glyphMiss} aria-hidden="true">
          {tone === "hit" ? resultPlaqueCopy.hitGlyph : resultPlaqueCopy.missGlyph}
        </span>
      )}
      <div className={styles.body}>
        {kicker !== null && <p className={KICKER_BY_TONE[tone]}>{kicker}</p>}
        <p className={styles.title}>{title}</p>
        {detail !== undefined && detail !== null && <div className={styles.detail}>{detail}</div>}
        {children !== undefined && children !== null && (
          <div className={styles.footer}>{children}</div>
        )}
      </div>
      {points !== null && (
        <div className={styles.award}>
          <span className={revealPoints}>{points}</span>
          {pointsCaption !== null && <span className={styles.pointsCaption}>{pointsCaption}</span>}
        </div>
      )}
    </div>
  );
};
