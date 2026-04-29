import type { RoundResultsRow } from "../resolveStageViewModel";
import { resolveTeamColorVariant } from "../../../../utils/resolveTeamColorVariant";
import { roundResultsStageCopy } from "./copy";
import * as styles from "./styles";

type RoundResultsStageBodyProps = {
  roundNumber: number | null;
  teamRows: RoundResultsRow[];
  topTeamId: string | null;
};

export const RoundResultsStageBody = ({
  roundNumber,
  teamRows,
  topTeamId
}: RoundResultsStageBodyProps): JSX.Element => {
  const roundNumberLabel =
    roundNumber !== null
      ? roundResultsStageCopy.formatRoundNumber(roundNumber)
      : roundResultsStageCopy.fallbackRoundNumber;

  return (
    <div className={styles.container}>
      <span className={styles.ambient} aria-hidden />
      <div className={styles.header}>
        <span className={styles.eyebrow}>{roundResultsStageCopy.eyebrow}</span>
        <h2 className={styles.heading}>
          {roundResultsStageCopy.headingPrefix}{" "}
          <span className={styles.headingAccent}>{roundNumberLabel}</span>{" "}
          {roundResultsStageCopy.headingSuffix}
        </h2>
      </div>
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>{roundResultsStageCopy.teamColumnLabel}</span>
          <span className={styles.tableHeaderNum}>{roundResultsStageCopy.wingsColumnLabel}</span>
          <span className={styles.tableHeaderNum}>{roundResultsStageCopy.gameColumnLabel}</span>
          <span className={styles.tableHeaderNum}>{roundResultsStageCopy.thisRoundColumnLabel}</span>
        </div>
        {teamRows.length === 0 && (
          <div className={`${styles.tableRow}`}>
            <span className={styles.teamCell}>{roundResultsStageCopy.emptyLabel}</span>
          </div>
        )}
        {teamRows.map((row) => {
          const isTop = row.teamId === topTeamId;
          const variant = resolveTeamColorVariant(row.teamId);
          const totalClassName = `${styles.num} ${
            isTop ? styles.numTotalTop : styles.numTotal
          }`;
          return (
            <div
              key={row.teamId}
              className={`${styles.tableRow} ${variant.rowAccentBgClassName}`}
            >
              <span
                className={`${styles.tableRowEdge} ${variant.splitEdgeMutedClassName}`}
                aria-hidden
              />
              <span className={styles.teamCell}>{row.teamName}</span>
              <span className={`${styles.num} ${styles.numMuted}`}>
                {roundResultsStageCopy.formatPointsDelta(row.wingPoints)}
              </span>
              <span className={`${styles.num} ${styles.numMuted}`}>
                {roundResultsStageCopy.formatPointsDelta(row.minigamePoints)}
              </span>
              <span className={totalClassName}>
                {roundResultsStageCopy.formatPointsDelta(row.totalPoints)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
