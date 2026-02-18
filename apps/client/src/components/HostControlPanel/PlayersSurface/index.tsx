import type { Player, Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type PlayersSurfaceBaseProps = {
  players: Player[];
  teams: Team[];
  assignedTeamByPlayerId: Map<string, string>;
};

type SetupPlayersSurfaceProps = PlayersSurfaceBaseProps & {
  mode: "setup";
  assignmentDisabled: boolean;
  onAssignPlayer: (playerId: string, selectedTeamId: string) => void;
};

type EatingPlayersSurfaceProps = PlayersSurfaceBaseProps & {
  mode: "eating";
  teamNameByTeamId: Map<string, string>;
  wingParticipationByPlayerId: Record<string, boolean>;
  activeRoundTeamId: string | null;
  activeRoundTeamName: string;
  participationDisabled: boolean;
  onSetWingParticipation: (playerId: string, didEat: boolean) => void;
};

type PlayersSurfaceProps = SetupPlayersSurfaceProps | EatingPlayersSurfaceProps;

export const PlayersSurface = (props: PlayersSurfaceProps): JSX.Element => {
  const { players, teams, assignedTeamByPlayerId } = props;
  const visiblePlayers =
    props.mode === "eating"
      ? players.filter((player) => assignedTeamByPlayerId.get(player.id) === props.activeRoundTeamId)
      : players;
  const emptyPlayersLabel =
    props.mode === "eating" && props.activeRoundTeamId !== null
      ? hostControlPanelCopy.activeTeamNoPlayersLabel
      : hostControlPanelCopy.noPlayersLabel;
  const shouldRenderTurnContext = props.mode === "eating" && props.activeRoundTeamId !== null;

  return (
    <section className={`${styles.card} ${styles.playersCard}`}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.playersSectionTitle}</h2>
      {props.mode === "eating" && (
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.eatingParticipationDescription}
        </p>
      )}
      {shouldRenderTurnContext && (
        <div className={styles.turnMeta}>
          <p className={styles.turnTitle}>{hostControlPanelCopy.activeRoundTeamTitle}</p>
          <p className={styles.turnValue}>
            {hostControlPanelCopy.activeRoundTeamValue(props.activeRoundTeamName)}
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
                {props.mode === "setup" && (
                  <select
                    aria-label={hostControlPanelCopy.assignmentSelectLabel(player.name)}
                    className={styles.assignmentSelect}
                    value={assignedTeamId}
                    onChange={(event): void => {
                      props.onAssignPlayer(player.id, event.target.value);
                    }}
                    disabled={props.assignmentDisabled}
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
                {props.mode === "eating" && (
                  <div className={styles.participationRow}>
                    <span className={styles.playerMeta}>
                      {assignedTeamId.length > 0
                        ? hostControlPanelCopy.assignedTeamLabel(
                            props.teamNameByTeamId.get(assignedTeamId) ??
                              hostControlPanelCopy.noAssignedTeamLabel
                          )
                        : hostControlPanelCopy.noAssignedTeamLabel}
                    </span>
                    <label className={styles.participationLabel}>
                      <input
                        className={styles.participationControl}
                        type="checkbox"
                        checked={props.wingParticipationByPlayerId[player.id] === true}
                        onChange={(event): void => {
                          props.onSetWingParticipation(player.id, event.target.checked);
                        }}
                        disabled={
                          props.participationDisabled ||
                          assignedTeamId.length === 0 ||
                          (props.activeRoundTeamId !== null &&
                            assignedTeamId !== props.activeRoundTeamId)
                        }
                        aria-label={hostControlPanelCopy.wingParticipationToggleLabel(player.name)}
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
