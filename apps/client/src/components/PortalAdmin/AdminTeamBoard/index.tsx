import { useMemo, useState } from "react";
import {
  PORTAL_API_ROUTES,
  isAdminPicksState,
  isAdminTeamBoard,
  resolveAdminGuestTeamRoute,
  resolveThemeTeam,
  type AdminTeamBoard as AdminTeamBoardData
} from "@wingnight/shared/guestPortal";

import { jsonRequest, requestPortal } from "../../../utils/portalApi";
import { resolveTeamThemeById } from "../../../utils/resolveTeamTheme";
import * as shellStyles from "../../PortalShell/styles";
import { TeamWordmark } from "../../TeamWordmark";
import { adminTeamBoardCopy } from "./copy";
import { MemberList } from "./MemberList";
import * as styles from "./styles";

type AdminTeamBoardProps = {
  board: AdminTeamBoardData;
  onChanged: () => Promise<void>;
};

// Brad's team board: the switch that closes picks, then every team in seating order with the
// guests who picked it (or were moved there), and the unseated last — guests with no pick and
// guests whose pick names a team the pack no longer has. A move ignores the cap and the switch.
export const AdminTeamBoard = ({ board, onChanged }: AdminTeamBoardProps): JSX.Element => {
  const [isBusy, setIsBusy] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const themeById = useMemo(() => resolveTeamThemeById(board.teams.map(resolveThemeTeam)), [board.teams]);
  const seated = board.teams.reduce((count, team) => count + team.members.length, 0);

  const togglePicks = async (): Promise<void> => {
    setIsBusy(true);
    const result = await requestPortal(
      PORTAL_API_ROUTES.adminPicks,
      isAdminPicksState,
      jsonRequest("PUT", { closed: !board.picksClosed })
    );

    setHasFailed(!result.ok);
    await onChanged();
    setIsBusy(false);
  };

  const move = async (guestId: string, teamName: string | null): Promise<void> => {
    setIsBusy(true);
    const result = await requestPortal(resolveAdminGuestTeamRoute(guestId), isAdminTeamBoard, jsonRequest("POST", { teamName }));

    setHasFailed(!result.ok);
    await onChanged();
    setIsBusy(false);
  };

  return (
    <section className={shellStyles.card} aria-labelledby="admin-teams-title">
      <p className={shellStyles.eyebrow}>{adminTeamBoardCopy.eyebrow(seated, seated + board.unseated.length)}</p>
      <h2 id="admin-teams-title" className={shellStyles.cardTitle}>
        {adminTeamBoardCopy.title}
      </h2>
      <p className={shellStyles.voice}>{adminTeamBoardCopy.body}</p>
      <div className={styles.switchRow}>
        <button
          type="button"
          role="switch"
          aria-checked={!board.picksClosed}
          className={board.picksClosed ? styles.switchClosed : styles.switchOpen}
          disabled={isBusy}
          data-testid="admin-picks-switch"
          onClick={(): void => void togglePicks()}
        >
          <span className={board.picksClosed ? styles.switchKnobOff : styles.switchKnob} aria-hidden />
          {isBusy ? adminTeamBoardCopy.switching : board.picksClosed ? adminTeamBoardCopy.picksClosed : adminTeamBoardCopy.picksOpen}
        </button>
      </div>
      <div className={styles.columns}>
        {board.teams.map((team) => {
          const theme = themeById.get(team.id);

          return (
            <div key={team.id} className={styles.column} data-testid="admin-team-column" data-team-name={team.name}>
              {theme !== undefined && (
                <span className={`${styles.columnWash} ${theme.colorVariant.splitColumnBgClassName}`} aria-hidden />
              )}
              <div className={styles.columnHead}>
                {theme === undefined ? (
                  <span className={styles.teamNamePlain}>{team.name}</span>
                ) : (
                  <TeamWordmark name={team.name} theme={theme} sizeClassName={styles.teamName} />
                )}
                <span className={styles.seats} data-testid="admin-team-seats">
                  {adminTeamBoardCopy.seats(team.members.length, board.seatCap)}
                </span>
              </div>
              <MemberList
                members={team.members}
                theme={theme}
                currentTeamName={team.name}
                teams={board.teams}
                isBusy={isBusy}
                emptyText={adminTeamBoardCopy.noMembers}
                onMove={move}
              />
            </div>
          );
        })}
        <div className={styles.column} data-testid="admin-unseated">
          <div className={styles.columnHead}>
            <span className={styles.teamNamePlain}>{adminTeamBoardCopy.unseatedTitle}</span>
            <span className={styles.seats}>{board.unseated.length}</span>
          </div>
          <MemberList
            members={board.unseated}
            theme={undefined}
            currentTeamName={null}
            teams={board.teams}
            isBusy={isBusy}
            emptyText={adminTeamBoardCopy.unseatedEmpty}
            onMove={move}
          />
        </div>
      </div>
      {hasFailed && (
        <p className={shellStyles.statusError} role="status">
          {adminTeamBoardCopy.failed}
        </p>
      )}
    </section>
  );
};
