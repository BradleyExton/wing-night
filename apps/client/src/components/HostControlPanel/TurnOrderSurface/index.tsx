import type { Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type TurnOrderSurfaceProps = {
  orderedTeams: Team[];
  onReorderTurnOrder?: (teamIds: string[]) => void;
};

const moveTeamId = (
  teamIds: string[],
  sourceIndex: number,
  targetIndex: number
): string[] => {
  const nextTeamIds = [...teamIds];
  const [movedTeamId] = nextTeamIds.splice(sourceIndex, 1);

  if (!movedTeamId) {
    return teamIds;
  }

  nextTeamIds.splice(targetIndex, 0, movedTeamId);
  return nextTeamIds;
};

export const TurnOrderSurface = ({
  orderedTeams,
  onReorderTurnOrder
}: TurnOrderSurfaceProps): JSX.Element => {
  const canReorder = onReorderTurnOrder !== undefined;
  const orderedTeamIds = orderedTeams.map((team) => team.id);

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.turnOrderSectionTitle}</h2>
      <p className={styles.sectionDescription}>{hostControlPanelCopy.turnOrderDescription}</p>
      {orderedTeams.length === 0 && (
        <p className={styles.emptyLabel}>{hostControlPanelCopy.turnOrderEmptyLabel}</p>
      )}
      {orderedTeams.length > 0 && (
        <ul className={styles.list}>
          {orderedTeams.map((team, index) => {
            const isFirstRow = index === 0;
            const isLastRow = index === orderedTeams.length - 1;

            return (
              <li className={styles.listRow} key={team.id}>
                <div className={styles.teamMeta}>
                  <span className={styles.teamName}>{team.name}</span>
                  <span className={styles.positionLabel}>
                    {hostControlPanelCopy.turnOrderPositionLabel(index, orderedTeams.length)}
                  </span>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.actionButton}
                    type="button"
                    disabled={!canReorder || isFirstRow}
                    onClick={(): void => {
                      const nextTeamIds = moveTeamId(orderedTeamIds, index, index - 1);
                      onReorderTurnOrder?.(nextTeamIds);
                    }}
                  >
                    {hostControlPanelCopy.turnOrderMoveUpButtonLabel}
                  </button>
                  <button
                    className={styles.actionButton}
                    type="button"
                    disabled={!canReorder || isLastRow}
                    onClick={(): void => {
                      const nextTeamIds = moveTeamId(orderedTeamIds, index, index + 1);
                      onReorderTurnOrder?.(nextTeamIds);
                    }}
                  >
                    {hostControlPanelCopy.turnOrderMoveDownButtonLabel}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
