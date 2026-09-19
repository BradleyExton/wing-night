import type { TeamTheme } from "@wingnight/shared";
import { Flame, Trophy } from "lucide-react";

import { TeamEmblem } from "../../../TeamEmblem";
import { TeamWordmark } from "../../../TeamWordmark";
import * as styles from "./styles";

type StandingBayProps = {
  name: string;
  score: number;
  theme: TeamTheme;
  /** Strictly ahead (or tied for the win at FINAL_RESULTS): this bay's lip runs gold. */
  isLeader: boolean;
  /** The lead is final, so the flame becomes a trophy. */
  isWinner: boolean;
  /** Already resolved by the deck, because only the deck can see the whole board. */
  metaLabel: string;
};

/**
 * One team's panel of the deck (DESIGN.md §2.2C): the team's colour down the
 * joint, its emblem watermarked into the face, its rank label and name cut
 * into the panel, and its score at the right edge.
 */
export const StandingBay = ({
  name,
  score,
  theme,
  isLeader,
  isWinner,
  metaLabel
}: StandingBayProps): JSX.Element => {
  const colorVariant = theme.colorVariant;
  const faceClassName = isLeader
    ? colorVariant.splitColumnLeadBgClassName
    : colorVariant.splitColumnBgClassName;
  const edgeClassName = isLeader
    ? colorVariant.splitEdgeFullClassName
    : colorVariant.splitEdgeMutedClassName;
  const LeaderIcon = isWinner ? Trophy : Flame;

  return (
    <div className={`${styles.bay} ${faceClassName}`}>
      <span className={`${styles.edge} ${edgeClassName}`} aria-hidden />
      {isLeader && <span className={styles.leadLip} aria-hidden />}
      <TeamEmblem
        theme={theme}
        sizeClassName={isLeader ? styles.watermarkLead : styles.watermark}
      />
      <div className={styles.info}>
        <span className={`${styles.meta} ${isLeader ? styles.metaLead : ""}`.trim()}>
          {metaLabel}
          {isLeader && <LeaderIcon className={styles.metaIcon} aria-hidden />}
        </span>
        <p className={styles.name}>
          <TeamWordmark name={name} theme={theme} sizeClassName={styles.wordmark} />
        </p>
      </div>
      <p className={`${styles.score} ${isLeader ? styles.scoreLead : ""}`.trim()}>{score}</p>
    </div>
  );
};
