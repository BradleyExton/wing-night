import { runningTotalsCopy } from "./copy.js";
import * as styles from "./styles.js";

// The round's pending points, team by team, with the team whose turn it is
// lit. It is the `readout` a Canvas floats above the corner dock and the last
// card in a Stage's deck (docs/takeover-layout-api.md §5, §8) — the round's
// pending points, not the game's standings, which is `StandingsSurface` on
// the TV and is why this is not called a standings panel.
//
// It takes plain room-shaped values rather than any one package's host-view
// type — that is what had made four identical copies unshareable — and `note`
// is the only variation between them: whatever this minigame wants to say
// under the rows, or nothing at all when it has nothing to add.
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
