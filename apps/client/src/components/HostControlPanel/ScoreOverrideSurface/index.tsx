import { useMemo, useState, type FormEvent } from "react";
import type { Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type ScoreOverrideSurfaceProps = {
  teams: Team[];
  onAdjustTeamScore?: (teamId: string, delta: number) => void;
};

const parseDelta = (rawValue: string): number | null => {
  const normalizedValue = rawValue.trim();

  if (!/^[+-]?\d+$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number.parseInt(normalizedValue, 10);

  if (!Number.isInteger(parsedValue) || parsedValue === 0) {
    return null;
  }

  return parsedValue;
};

export const ScoreOverrideSurface = ({
  teams,
  onAdjustTeamScore
}: ScoreOverrideSurfaceProps): JSX.Element => {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [deltaInput, setDeltaInput] = useState("");

  const fallbackTeamId = teams[0]?.id ?? "";
  const effectiveSelectedTeamId =
    selectedTeamId.length > 0 && teams.some((team) => team.id === selectedTeamId)
      ? selectedTeamId
      : fallbackTeamId;
  const parsedDelta = useMemo(() => parseDelta(deltaInput), [deltaInput]);
  const submitDisabled =
    onAdjustTeamScore === undefined ||
    effectiveSelectedTeamId.length === 0 ||
    parsedDelta === null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (submitDisabled || parsedDelta === null) {
      return;
    }

    onAdjustTeamScore?.(effectiveSelectedTeamId, parsedDelta);
    setDeltaInput("");
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.scoreOverrideSectionTitle}</h2>
      <p className={styles.sectionDescription}>
        {hostControlPanelCopy.scoreOverrideDescription}
      </p>
      {teams.length === 0 && (
        <p className={styles.emptyLabel}>{hostControlPanelCopy.scoreOverrideNoTeamsLabel}</p>
      )}
      {teams.length > 0 && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="score-override-team">
              {hostControlPanelCopy.scoreOverrideTeamLabel}
            </label>
            <select
              id="score-override-team"
              className={styles.select}
              value={effectiveSelectedTeamId}
              onChange={(event): void => {
                setSelectedTeamId(event.target.value);
              }}
            >
              {teams.map((team) => {
                return (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                );
              })}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="score-override-delta">
              {hostControlPanelCopy.scoreOverrideDeltaLabel}
            </label>
            <input
              id="score-override-delta"
              className={styles.input}
              value={deltaInput}
              onChange={(event): void => {
                setDeltaInput(event.target.value);
              }}
              placeholder={hostControlPanelCopy.scoreOverrideDeltaPlaceholder}
              inputMode="numeric"
            />
          </div>
          <button className={styles.actionButton} type="submit" disabled={submitDisabled}>
            {hostControlPanelCopy.scoreOverrideApplyButtonLabel}
          </button>
        </form>
      )}
    </section>
  );
};
