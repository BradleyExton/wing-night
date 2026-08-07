import { adminCopy } from "../../../copy/admin";
import type { ConfigDraft } from "../contentDraft";
import * as styles from "./styles";

type ReviewStepProps = {
  draft: ConfigDraft;
  geoPromptCount: number;
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
  draft,
  geoPromptCount,
  isLocked,
  isDirty,
  hasBlockingIssues,
  didApply,
  onApply
}: ReviewStepProps): JSX.Element => {
  const { gameConfig } = draft;
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
        draft.players.players.length,
        draft.teams.teams.length
      )
    },
    {
      key: adminCopy.reviewPromptsKey,
      value: adminCopy.reviewPromptsValue(
        draft.trivia.prompts.length,
        draft.drawing.prompts.length,
        geoPromptCount
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

      <p className={styles.warning}>{adminCopy.rosterOverwriteWarning}</p>

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
