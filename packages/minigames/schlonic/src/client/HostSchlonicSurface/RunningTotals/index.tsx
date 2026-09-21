import { runningTotalsCopy } from "./copy.js";
import * as styles from "./styles.js";

// The round's pending points, team by team, with the team whose turn it is
// lit. `note` is whatever this minigame wants to say under the rows — the par
// line here — and nothing at all when it has nothing to add.
export const RunningTotals = ({
  pendingPointsByTeamId,
  activeTurnTeamId,
  teamNameByTeamId,
  note
}: {
  pendingPointsByTeamId: Record<string, number>;
  activeTurnTeamId: string | null;
  teamNameByTeamId: Map<string, string>;
  note?: string;
}): JSX.Element => {
  const teamIds = Object.keys(pendingPointsByTeamId);

  return (
    <div className={styles.container}>
      <span className={styles.title}>{runningTotalsCopy.title}</span>
      {teamIds.map((teamId) => (
        <div
          key={teamId}
          className={`${styles.row}${teamId === activeTurnTeamId ? ` ${styles.rowActive}` : ""}`}
        >
          <span>{teamNameByTeamId.get(teamId) ?? teamId}</span>
          <span className={styles.points}>
            {runningTotalsCopy.points(pendingPointsByTeamId[teamId] ?? 0)}
          </span>
        </div>
      ))}
      {note !== undefined && <span className={styles.note}>{note}</span>}
    </div>
  );
};
