import type { Player, Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type PlayersSurfaceProps = {
  players: Player[];
  teams: Team[];
  assignedTeamByPlayerId: Map<string, string>;
  teamNameByTeamId: Map<string, string>;
  isSetupPhase: boolean;
  isEatingPhase: boolean;
  wingParticipationByPlayerId: Record<string, boolean>;
  assignmentDisabled: boolean;
  participationDisabled: boolean;
  onAssignPlayer: (playerId: string, selectedTeamId: string) => void;
  onSetWingParticipation: (playerId: string, didEat: boolean) => void;
};

export const PlayersSurface = ({
  players,
  teams,
  assignedTeamByPlayerId,
  teamNameByTeamId,
  isSetupPhase,
  isEatingPhase,
  wingParticipationByPlayerId,
  assignmentDisabled,
  participationDisabled,
  onAssignPlayer,
  onSetWingParticipation
}: PlayersSurfaceProps): JSX.Element => {
  return (
    <section className={`${styles.card} ${styles.playersCard}`}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.playersSectionTitle}</h2>
      {isEatingPhase && (
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.eatingParticipationDescription}
        </p>
      )}
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
                {isSetupPhase && (
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
                )}
                {isEatingPhase && (
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
                        disabled={participationDisabled || assignedTeamId.length === 0}
                        aria-label={hostControlPanelCopy.wingParticipationToggleLabel(
                          player.name
                        )}
                      />
                      <span>{hostControlPanelCopy.ateWingLabel}</span>
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
