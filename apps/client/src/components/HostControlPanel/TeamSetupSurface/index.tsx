import type { FormEvent } from "react";
import type { Player, Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import { resolveTeamColorVariant } from "../../../utils/resolveTeamColorVariant";
import { resolveTeamRosterPreview } from "../../../utils/resolveTeamRosterPreview";
import * as styles from "./styles";

type TeamSetupSurfaceProps = {
  nextTeamName: string;
  setupMutationsDisabled: boolean;
  players: Player[];
  teams: Team[];
  onNextTeamNameChange: (nextTeamName: string) => void;
  onCreateTeamSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const TeamSetupSurface = ({
  nextTeamName,
  setupMutationsDisabled,
  players,
  teams,
  onNextTeamNameChange,
  onCreateTeamSubmit
}: TeamSetupSurfaceProps): JSX.Element => {
  const playerById = new Map(players.map((player) => [player.id, player] as const));

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
              const teamColorVariant = resolveTeamColorVariant(team.id);
              const teamRosterPreview = resolveTeamRosterPreview(team, playerById, 2);

              return (
                <li
                  className={`${styles.listRow} ${teamColorVariant.borderAccentClassName}`}
                  key={team.id}
                >
                  <div className={styles.teamIdentity}>
                    <span
                      className={`${styles.teamAccentDot} ${teamColorVariant.dotAccentClassName}`}
                      aria-hidden
                    />
                    <div>
                      <span className={styles.teamName}>{team.name}</span>
                      <p className={styles.teamRoster}>
                        {hostControlPanelCopy.teamRosterValue(
                          teamRosterPreview.visiblePlayerNames,
                          teamRosterPreview.hiddenPlayerCount
                        )}
                      </p>
                    </div>
                  </div>
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
