import { hostControlPanelCopy } from "../../copy";
import type { EatingPlayersSurfaceProps } from "../index";
import * as styles from "./styles";

export const EatingPlayersSurface = ({
  players,
  assignedTeamByPlayerId,
  teamNameByTeamId,
  wingParticipationByPlayerId,
  activeRoundTeamId,
  activeRoundTeamName,
  participationDisabled,
  onSetWingParticipation
}: EatingPlayersSurfaceProps): JSX.Element => {
  const visiblePlayers = players.filter((player) => {
    return assignedTeamByPlayerId.get(player.id) === activeRoundTeamId;
  });

  const emptyPlayersLabel =
    activeRoundTeamId !== null
      ? hostControlPanelCopy.activeTeamNoPlayersLabel
      : hostControlPanelCopy.noPlayersLabel;

  return (
    <section className={`${styles.card} ${styles.playersCard}`}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.playersSectionTitle}</h2>
      <p className={styles.sectionDescription}>
        {hostControlPanelCopy.eatingParticipationDescription}
      </p>

      {activeRoundTeamId !== null && (
        <div className={styles.turnMeta}>
          <p className={styles.turnTitle}>{hostControlPanelCopy.activeRoundTeamTitle}</p>
          <p className={styles.turnValue}>
            {hostControlPanelCopy.activeRoundTeamValue(activeRoundTeamName)}
          </p>
        </div>
      )}

      {visiblePlayers.length === 0 && (
        <p className={styles.sectionDescription}>{emptyPlayersLabel}</p>
      )}

      {visiblePlayers.length > 0 && (
        <ul className={styles.list}>
          {visiblePlayers.map((player) => {
            const assignedTeamId = assignedTeamByPlayerId.get(player.id) ?? "";

            return (
              <li key={player.id} className={styles.listRow}>
                <span className={styles.playerName}>{player.name}</span>
                <div className={styles.participationRow}>
                  <span className={styles.playerMeta}>
                    {assignedTeamId.length > 0
                      ? hostControlPanelCopy.assignedTeamLabel(
                          teamNameByTeamId.get(assignedTeamId) ??
                            hostControlPanelCopy.noAssignedTeamLabel
                        )
                      : hostControlPanelCopy.noAssignedTeamLabel}
                  </span>
                  <label className={styles.participationLabel}>
                    <input
                      className={styles.participationControl}
                      type="checkbox"
                      checked={wingParticipationByPlayerId[player.id] === true}
                      onChange={(event): void => {
                        onSetWingParticipation(player.id, event.target.checked);
                      }}
                      disabled={
                        participationDisabled ||
                        assignedTeamId.length === 0 ||
                        (activeRoundTeamId !== null && assignedTeamId !== activeRoundTeamId)
                      }
                      aria-label={hostControlPanelCopy.wingParticipationToggleLabel(player.name)}
                    />
                    <span>{hostControlPanelCopy.ateWingLabel}</span>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
