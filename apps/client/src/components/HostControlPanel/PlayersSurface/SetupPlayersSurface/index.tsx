import { type FormEvent, useId, useState } from "react";

import { hostControlPanelCopy } from "../../copy";
import { resolveTeamColorVariant } from "../../../../utils/resolveTeamColorVariant";
import type { SetupPlayersSurfaceProps } from "../index";
import * as styles from "./styles";

const truncateChipLabel = (teamName: string): string => {
  const trimmed = teamName.trim();

  if (trimmed.length <= 4) {
    return trimmed.toUpperCase();
  }

  return trimmed.slice(0, 3).toUpperCase();
};

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
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <span>{hostControlPanelCopy.playersSectionTitle}</span>
        <span className={styles.groupCount}>{players.length}</span>
      </div>

      {players.length === 0 && (
        <div className={styles.row}>
          <span className={styles.rowMeta}>{hostControlPanelCopy.noPlayersLabel}</span>
        </div>
      )}

      {players.map((player) => {
        const assignedTeamId = assignedTeamByPlayerId.get(player.id) ?? "";

        return (
          <div key={player.id} className={styles.row}>
            <span className={styles.rowName}>{player.name}</span>
            <div
              className={styles.chipRow}
              role="group"
              aria-label={hostControlPanelCopy.assignmentSelectLabel(player.name)}
            >
              {teams.map((team) => {
                const isActive = team.id === assignedTeamId;
                const teamColorVariant = resolveTeamColorVariant(team.id);
                const chipClassName = `${styles.chip} ${
                  isActive ? styles.chipActive : ""
                }`;

                return (
                  <button
                    key={team.id}
                    type="button"
                    className={chipClassName}
                    disabled={assignmentDisabled}
                    aria-pressed={isActive}
                    aria-label={team.name}
                    onClick={(): void => {
                      onAssignPlayer(player.id, isActive ? "" : team.id);
                    }}
                  >
                    <span
                      className={`${styles.teamDot} ${teamColorVariant.dotAccentClassName}`}
                      aria-hidden
                    />
                    {truncateChipLabel(team.name)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <form className={styles.addRow} onSubmit={handleAddPlayerSubmit}>
        <label className="sr-only" htmlFor={playerNameInputId}>
          {hostControlPanelCopy.playerNameInputLabel}
        </label>
        <input
          id={playerNameInputId}
          className={styles.input}
          value={nextPlayerName}
          disabled={addPlayerDisabled}
          onChange={(event): void => {
            setNextPlayerName(event.target.value);
          }}
          placeholder={hostControlPanelCopy.playerNameInputPlaceholder}
        />
        <button className={styles.addButton} type="submit" disabled={addPlayerDisabled}>
          {hostControlPanelCopy.addPlayerButtonLabel}
        </button>
      </form>
    </section>
  );
};
