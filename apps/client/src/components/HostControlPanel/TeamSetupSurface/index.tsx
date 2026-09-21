import type { FormEvent } from "react";
import type { Team, TeamTheme } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import { resolveTeamTheme } from "../../../utils/resolveTeamTheme";
import * as styles from "./styles";

type TeamSetupSurfaceProps = {
  nextTeamName: string;
  setupMutationsDisabled: boolean;
  teams: Team[];
  teamThemeByTeamId: Map<string, TeamTheme>;
  onNextTeamNameChange: (nextTeamName: string) => void;
  onCreateTeamSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const TeamSetupSurface = ({
  nextTeamName,
  setupMutationsDisabled,
  teams,
  teamThemeByTeamId,
  onNextTeamNameChange,
  onCreateTeamSubmit
}: TeamSetupSurfaceProps): JSX.Element => {
  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <span>{hostControlPanelCopy.teamsSectionTitle}</span>
        <span className={styles.groupCount}>{teams.length}</span>
      </div>

      {teams.length === 0 && (
        <div className={styles.row}>
          <span className={styles.rowMeta}>{hostControlPanelCopy.noTeamsLabel}</span>
        </div>
      )}

      {teams.map((team) => {
        const teamColorVariant = (teamThemeByTeamId.get(team.id) ?? resolveTeamTheme(team))
          .colorVariant;
        return (
          <div key={team.id} className={styles.row}>
            <span className={styles.rowName}>
              <span
                className={`${styles.teamDot} ${teamColorVariant.dotAccentClassName}`}
                aria-hidden
              />
              {team.name}
            </span>
            <span className={styles.rowMeta}>
              {hostControlPanelCopy.teamMembersLabel(team.playerIds.length)}
            </span>
          </div>
        );
      })}

      <form className={styles.addRow} onSubmit={onCreateTeamSubmit}>
        <label className="sr-only" htmlFor="team-name-input">
          {hostControlPanelCopy.teamNameInputLabel}
        </label>
        <input
          id="team-name-input"
          className={styles.input}
          value={nextTeamName}
          disabled={setupMutationsDisabled}
          onChange={(event): void => {
            onNextTeamNameChange(event.target.value);
          }}
          placeholder={hostControlPanelCopy.teamNameInputPlaceholder}
        />
        <button
          className={styles.addButton}
          type="submit"
          disabled={setupMutationsDisabled}
        >
          {hostControlPanelCopy.createTeamButtonLabel}
        </button>
      </form>
    </section>
  );
};
