import type { GameConfigFile } from "@wingnight/shared";

import { adminCopy } from "../../../copy/admin";
import { FieldIssue, hasFieldIssue } from "../FieldIssue";
import { parsePositiveInteger, type TimerKey } from "../gameConfigDraft";
import type { IssueMessagesByPath } from "../selectIssueMessages";
import * as styles from "./styles";

type ClocksScoringStepProps = {
  gameConfig: GameConfigFile;
  issueMessagesByPath: IssueMessagesByPath;
  isLocked: boolean;
  onTimerChange: (timerKey: TimerKey, seconds: number) => void;
  onScoringChange: (edit: Partial<GameConfigFile["minigameScoring"]>) => void;
};

const TIMER_FIELDS: readonly { key: TimerKey; label: string }[] = [
  { key: "eatingSeconds", label: adminCopy.eatingTimerLabel },
  { key: "triviaSeconds", label: adminCopy.triviaTimerLabel },
  { key: "geoSeconds", label: adminCopy.geoTimerLabel },
  { key: "drawingSeconds", label: adminCopy.drawingTimerLabel }
];

export const ClocksScoringStep = ({
  gameConfig,
  issueMessagesByPath,
  isLocked,
  onTimerChange,
  onScoringChange
}: ClocksScoringStepProps): JSX.Element => {
  const invalidClassName = (path: string): string =>
    hasFieldIssue(issueMessagesByPath, path) ? styles.inputInvalid : "";

  const scoringFields: readonly {
    key: keyof GameConfigFile["minigameScoring"];
    label: string;
  }[] = [
    { key: "defaultMax", label: adminCopy.defaultMaxLabel },
    { key: "finalRoundMax", label: adminCopy.finalRoundMaxLabel }
  ];

  return (
    <div className={styles.fieldGrid}>
      {TIMER_FIELDS.map((timerField) => (
        <div key={timerField.key} className={styles.field}>
          <label className={styles.label} htmlFor={`admin-timer-${timerField.key}`}>
            {timerField.label}
          </label>
          <input
            id={`admin-timer-${timerField.key}`}
            className={`${styles.numberInput} ${invalidClassName(
              `timers.${timerField.key}`
            )}`}
            inputMode="numeric"
            value={gameConfig.timers[timerField.key]}
            disabled={isLocked}
            onChange={(event): void => {
              onTimerChange(
                timerField.key,
                parsePositiveInteger(
                  event.target.value,
                  gameConfig.timers[timerField.key]
                )
              );
            }}
          />
          <FieldIssue
            messagesByPath={issueMessagesByPath}
            path={`timers.${timerField.key}`}
          />
        </div>
      ))}

      {scoringFields.map((scoringField) => (
        <div key={scoringField.key} className={styles.field}>
          <label
            className={styles.label}
            htmlFor={`admin-scoring-${scoringField.key}`}
          >
            {scoringField.label}
          </label>
          <input
            id={`admin-scoring-${scoringField.key}`}
            className={`${styles.numberInput} ${invalidClassName(
              `minigameScoring.${scoringField.key}`
            )}`}
            inputMode="numeric"
            value={gameConfig.minigameScoring[scoringField.key]}
            disabled={isLocked}
            onChange={(event): void => {
              onScoringChange({
                [scoringField.key]: parsePositiveInteger(
                  event.target.value,
                  gameConfig.minigameScoring[scoringField.key]
                )
              });
            }}
          />
          <FieldIssue
            messagesByPath={issueMessagesByPath}
            path={`minigameScoring.${scoringField.key}`}
          />
        </div>
      ))}
    </div>
  );
};
