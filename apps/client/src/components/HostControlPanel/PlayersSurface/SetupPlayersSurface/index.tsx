import { type FormEvent, useId, useState } from "react";

import { hostControlPanelCopy } from "../../copy";
import type { SetupPlayersSurfaceProps } from "../index";
import * as styles from "./styles";

export const SetupPlayersSurface = ({
  players,
  teams,
  assignedTeamByPlayerId,
  assignmentDisabled,
  addPlayerDisabled,
  onAssignPlayer,
  onAddPlayer
}: SetupPlayersSurfaceProps): JSX.Element => {
  const [nextPlayerName, setNextPlayerName] = useState("");
  const playerNameInputId = useId();

  const handleAddPlayerSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const normalizedPlayerName = nextPlayerName.trim();

    if (normalizedPlayerName.length === 0) {
      return;
    }

    onAddPlayer(normalizedPlayerName);
    setNextPlayerName("");
  };

  return (
    <section className={`${styles.card} ${styles.playersCard}`}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.playersSectionTitle}</h2>
      <form className={styles.playerCreateForm} onSubmit={handleAddPlayerSubmit}>
        <div className={styles.playerInputGroup}>
          <label className={styles.playerInputLabel} htmlFor={playerNameInputId}>
            {hostControlPanelCopy.playerNameInputLabel}
          </label>
          <input
            id={playerNameInputId}
            className={styles.playerInput}
            value={nextPlayerName}
            disabled={addPlayerDisabled}
            onChange={(event): void => {
              setNextPlayerName(event.target.value);
            }}
            placeholder={hostControlPanelCopy.playerNameInputPlaceholder}
          />
        </div>
        <button className={styles.actionButton} type="submit" disabled={addPlayerDisabled}>
          {hostControlPanelCopy.addPlayerButtonLabel}
        </button>
      </form>

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
