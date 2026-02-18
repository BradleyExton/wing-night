import type { FormEvent } from "react";
import type { Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type TeamSetupSurfaceProps = {
  nextTeamName: string;
  setupMutationsDisabled: boolean;
  teams: Team[];
  onNextTeamNameChange: (nextTeamName: string) => void;
  onCreateTeamSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const TeamSetupSurface = ({
  nextTeamName,
  setupMutationsDisabled,
  teams,
  onNextTeamNameChange,
  onCreateTeamSubmit
}: TeamSetupSurfaceProps): JSX.Element => {
  return (
    <section className={styles.sectionGrid}>
      <div className={styles.card}>
        <h2 className={styles.sectionHeading}>{hostControlPanelCopy.teamSetupTitle}</h2>
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.teamSetupDescription}
        </p>
        <form className={styles.teamCreateForm} onSubmit={onCreateTeamSubmit}>
          <div className={styles.teamInputGroup}>
            <label className={styles.teamInputLabel} htmlFor="team-name-input">
              {hostControlPanelCopy.teamNameInputLabel}
            </label>
            <input
              id="team-name-input"
              className={styles.teamInput}
              value={nextTeamName}
              disabled={setupMutationsDisabled}
              onChange={(event): void => {
                onNextTeamNameChange(event.target.value);
              }}
              placeholder={hostControlPanelCopy.teamNameInputPlaceholder}
            />
          </div>
          <button
            className={styles.actionButton}
            type="submit"
            disabled={setupMutationsDisabled}
          >
            {hostControlPanelCopy.createTeamButtonLabel}
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionHeading}>{hostControlPanelCopy.teamsSectionTitle}</h2>
        {teams.length === 0 && (
          <p className={styles.sectionDescription}>{hostControlPanelCopy.noTeamsLabel}</p>
        )}
        {teams.length > 0 && (
          <ul className={styles.list}>
            {teams.map((team) => {
              return (
                <li className={styles.listRow} key={team.id}>
                  <span className={styles.teamName}>{team.name}</span>
                  <span className={styles.teamMeta}>
                    {hostControlPanelCopy.teamMembersLabel(team.playerIds.length)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
