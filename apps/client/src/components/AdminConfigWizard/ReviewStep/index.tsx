import type { ConfigContentSnapshot, GameConfigFile } from "@wingnight/shared";

import { adminCopy } from "../../../copy/admin";
import * as styles from "./styles";

type ReviewStepProps = {
  gameConfig: GameConfigFile;
  roster: Pick<ConfigContentSnapshot, "players" | "teams"> | null;
  isLocked: boolean;
  isDirty: boolean;
  hasBlockingIssues: boolean;
  didApply: boolean;
  onApply: () => void;
};

const resolveApplyLabel = (
  isDirty: boolean,
  hasBlockingIssues: boolean,
  didApply: boolean
): string => {
  if (hasBlockingIssues) {
    return adminCopy.applyBlockedLabel;
  }

  if (isDirty) {
    return adminCopy.applyLabel;
  }

  return didApply ? adminCopy.appliedLabel : adminCopy.applyCleanLabel;
};

export const ReviewStep = ({
  gameConfig,
  roster,
  isLocked,
  isDirty,
  hasBlockingIssues,
  didApply,
  onApply
}: ReviewStepProps): JSX.Element => {
  const rows: readonly { key: string; value: string }[] = [
    { key: adminCopy.reviewPackKey, value: gameConfig.name },
    {
      key: adminCopy.reviewLineupKey,
      value: gameConfig.rounds
        .map((round) =>
          adminCopy.reviewLineupEntry(round.round, round.label, round.minigame)
        )
        .join(adminCopy.reviewLineupSeparator)
    },
    {
      key: adminCopy.reviewTimersKey,
      value: adminCopy.reviewTimersValue(gameConfig.timers)
    },
    {
      key: adminCopy.reviewScoringKey,
      value: adminCopy.reviewScoringValue(
        gameConfig.minigameScoring.defaultMax,
        gameConfig.minigameScoring.finalRoundMax
      )
    },
    {
      key: adminCopy.reviewRosterKey,
      value: adminCopy.reviewRosterValue(
        roster?.players.length ?? 0,
        roster?.teams.length ?? 0
      )
    }
  ];

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        {rows.map((row) => (
          <div key={row.key} className={styles.reviewRow}>
            <span className={styles.reviewKey}>{row.key}</span>
            <span className={styles.reviewValue}>{row.value}</span>
          </div>
        ))}
      </div>

      <p className={styles.warning}>{adminCopy.hostAuthCoexistenceWarning}</p>

      <button
        type="button"
        className={styles.applyButton}
        disabled={isLocked || hasBlockingIssues || !isDirty}
        onClick={onApply}
      >
        {resolveApplyLabel(isDirty, hasBlockingIssues, didApply)}
      </button>
    </div>
  );
};
