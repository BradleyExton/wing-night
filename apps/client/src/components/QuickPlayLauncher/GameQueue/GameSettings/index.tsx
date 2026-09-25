import { useId } from "react";

import { quickPlayLauncherCopy } from "../../copy";
import {
  humanizeRuleKey,
  resolveEditableRuleFields,
  type QuickPlayQueueEntry
} from "../../quickPlayDraft";
import * as styles from "./styles";

type GameSettingsProps = {
  entry: QuickPlayQueueEntry;
  onSetRule: (ruleKey: string, value: number | boolean) => void;
  onSetTimer: (timerSeconds: number) => void;
};

// One control per scalar rule the pack declares for this game, plus the
// clock for a clock-paced one. The labels are the config keys spelled out,
// because the host wrote those keys.
export const GameSettings = ({ entry, onSetRule, onSetTimer }: GameSettingsProps): JSX.Element => {
  const idPrefix = useId();
  const ruleFields = resolveEditableRuleFields(entry.rules);
  const hasSettings = ruleFields.length > 0 || entry.timerSeconds !== null;

  if (!hasSettings) {
    return <p className={styles.empty}>{quickPlayLauncherCopy.noSettingsLabel}</p>;
  }

  return (
    <div className={styles.root}>
      <span className={styles.title}>{quickPlayLauncherCopy.settingsTitle}</span>
      <div className={styles.fields}>
        {entry.timerSeconds !== null && (
          <label className={styles.field} htmlFor={`${idPrefix}-timer`}>
            <span className={styles.fieldLabel}>{quickPlayLauncherCopy.timerFieldLabel}</span>
            <input
              id={`${idPrefix}-timer`}
              className={styles.input}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={entry.timerSeconds}
              onChange={(event): void => {
                onSetTimer(Number(event.target.value));
              }}
            />
          </label>
        )}
        {ruleFields.map((field) =>
          typeof field.value === "boolean" ? (
            <label key={field.key} className={styles.toggleField} htmlFor={`${idPrefix}-${field.key}`}>
              <input
                id={`${idPrefix}-${field.key}`}
                className={styles.checkbox}
                type="checkbox"
                checked={field.value}
                onChange={(event): void => {
                  onSetRule(field.key, event.target.checked);
                }}
              />
              <span className={styles.fieldLabel}>{humanizeRuleKey(field.key)}</span>
            </label>
          ) : (
            <label key={field.key} className={styles.field} htmlFor={`${idPrefix}-${field.key}`}>
              <span className={styles.fieldLabel}>{humanizeRuleKey(field.key)}</span>
              <input
                id={`${idPrefix}-${field.key}`}
                className={styles.input}
                type="number"
                inputMode="numeric"
                step={1}
                value={field.value}
                onChange={(event): void => {
                  onSetRule(field.key, Number(event.target.value));
                }}
              />
            </label>
          )
        )}
      </div>
    </div>
  );
};
