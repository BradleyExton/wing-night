import { hostControlPanelCopy } from "../../copy";
import type { SetupPlayersSurfaceProps } from "../index";
import * as styles from "./styles";

export const SetupPlayersSurface = ({
  players,
  teams,
  assignedTeamByPlayerId,
  assignmentDisabled,
  onAssignPlayer
}: SetupPlayersSurfaceProps): JSX.Element => {
  return (
    <section className={`${styles.card} ${styles.playersCard}`}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.playersSectionTitle}</h2>

      {players.length === 0 && (
        <p className={styles.sectionDescription}>{hostControlPanelCopy.noPlayersLabel}</p>
      )}

      {players.length > 0 && (
        <ul className={styles.list}>
          {players.map((player) => {
            const assignedTeamId = assignedTeamByPlayerId.get(player.id) ?? "";

            return (
              <li key={player.id} className={styles.listRow}>
                <span className={styles.playerName}>{player.name}</span>
                <select
                  aria-label={hostControlPanelCopy.assignmentSelectLabel(player.name)}
                  className={styles.assignmentSelect}
                  value={assignedTeamId}
                  onChange={(event): void => {
                    onAssignPlayer(player.id, event.target.value);
                  }}
                  disabled={assignmentDisabled}
                >
                  <option value="">{hostControlPanelCopy.unassignedOptionLabel}</option>
                  {teams.map((team) => {
                    return (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    );
                  })}
                </select>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
