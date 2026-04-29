import { Check } from "lucide-react";

import { hostControlPanelCopy } from "../../copy";
import { resolveTeamColorVariant } from "../../../../utils/resolveTeamColorVariant";
import type { EatingPlayersSurfaceProps } from "../index";
import * as styles from "./styles";

export const EatingPlayersSurface = ({
  players,
  assignedTeamByPlayerId,
  activeRoundTeamId,
  participationDisabled,
  wingParticipationByPlayerId,
  onSetWingParticipation
}: EatingPlayersSurfaceProps): JSX.Element => {
  const visiblePlayers = players.filter((player) => {
    return assignedTeamByPlayerId.get(player.id) === activeRoundTeamId;
  });

  const emptyLabel =
    activeRoundTeamId !== null
      ? hostControlPanelCopy.activeTeamNoPlayersLabel
      : hostControlPanelCopy.noPlayersLabel;

  const completedCount = visiblePlayers.reduce((count, player) => {
    return wingParticipationByPlayerId[player.id] === true ? count + 1 : count;
  }, 0);

  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <span>{hostControlPanelCopy.playersSectionTitle}</span>
        <span className={styles.groupCount}>
          {completedCount} / {visiblePlayers.length}
        </span>
      </div>

      {visiblePlayers.length === 0 && (
        <div className={styles.row}>
          <span className={styles.rowMeta}>{emptyLabel}</span>
        </div>
      )}

      {visiblePlayers.map((player) => {
        const isSelected = wingParticipationByPlayerId[player.id] === true;
        const assignedTeamId = assignedTeamByPlayerId.get(player.id) ?? "";
        const teamColorVariant =
          assignedTeamId.length > 0 ? resolveTeamColorVariant(assignedTeamId) : null;
        const rowClassName = `${styles.row} ${isSelected ? styles.rowSelected : ""}`;
        const checkClassName = `${styles.rowCheck} ${
          isSelected ? styles.rowCheckActive : ""
        }`;

        return (
          <button
            key={player.id}
            type="button"
            className={rowClassName}
            disabled={participationDisabled}
            aria-pressed={isSelected}
            aria-label={hostControlPanelCopy.wingParticipationToggleLabel(player.name)}
            onClick={(): void => {
              onSetWingParticipation(player.id, !isSelected);
            }}
          >
            <span className={styles.rowName}>
              {teamColorVariant !== null && (
                <span
                  className={`${styles.teamDot} ${teamColorVariant.dotAccentClassName}`}
                  aria-hidden
                />
              )}
              {player.name}
            </span>
            <span className={checkClassName} aria-hidden>
              {isSelected && <Check className={styles.rowCheckIcon} strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </section>
  );
};
