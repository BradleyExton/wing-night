import type { TeamTheme } from "@wingnight/shared";
import { resolveGuestAvatarRoute, type PortalTeam } from "@wingnight/shared/guestPortal";

import type { PortalTeamsState } from "../../../utils/usePortalTeams";
import { PortalHeadBird } from "../../PortalHeadBird";
import * as shellStyles from "../../PortalShell/styles";
import { TeamWordmark } from "../../TeamWordmark";
import type { TeamPickHandle } from "../useTeamPick";
import { teamPickCardCopy } from "./copy";
import { isPickOrphaned, resolveTeamTile } from "./teamPickState";
import * as styles from "./styles";

type TeamPickCardProps = {
  teams: PortalTeamsState;
  pick: TeamPickHandle;
  themeById: ReadonlyMap<string, TeamTheme>;
};

const TILE_CLASS_BY_STATE = { picked: styles.tilePicked, full: styles.tileFull, open: styles.tile } as const;

const resolveMemberHeadSrc = (member: PortalTeam["members"][number]): string | null =>
  member.headHash === null ? null : `${resolveGuestAvatarRoute(member.guestId)}?v=${member.headHash}`;

// An orphaned pick asks for a new one — unless picks are closed, when there is nothing to pick
// and only Brad can seat them: the line defers to the closed copy rather than ask the impossible.
const resolveStatusText = (pick: TeamPickHandle, teams: ReadonlyArray<PortalTeam>, picksClosed: boolean): string => {
  switch (pick.status.kind) {
    case "saving":
      return teamPickCardCopy.saving;
    case "saved":
      return teamPickCardCopy.saved(pick.status.teamName);
    case "failed":
      return teamPickCardCopy.failures[pick.status.error] ?? teamPickCardCopy.failed;
    case "idle":
      if (!isPickOrphaned(pick.state.pickedName, teams)) {
        return "";
      }

      return picksClosed ? teamPickCardCopy.closedBody : teamPickCardCopy.orphaned;
  }
};

// The guest's team: one tile per team the pack has, tapped to pick (the save is the tap: no
// confirm, docs/guest-portal-team-pick-plan.md decision 2). The members who have picked stand on
// the tile as their birds in the team's kit, the seats count in the score face.
export const TeamPickCard = ({ teams, pick, themeById }: TeamPickCardProps): JSX.Element => {
  const list = teams.kind === "ready" ? teams.teams : null;
  const picksClosed = list?.picksClosed ?? false;
  const statusText =
    teams.kind === "loading"
      ? teamPickCardCopy.loading
      : teams.kind === "failed"
        ? teamPickCardCopy.loadFailed
        : resolveStatusText(pick, teams.teams.teams, picksClosed);
  const isError = teams.kind === "failed" || pick.status.kind === "failed";

  return (
    <section className={shellStyles.card} aria-labelledby="team-pick-title">
      <p className={shellStyles.eyebrow}>{teamPickCardCopy.eyebrow}</p>
      <h2 id="team-pick-title" className={shellStyles.cardTitle}>
        {teamPickCardCopy.title}
      </h2>
      <p className={shellStyles.voice}>{picksClosed ? teamPickCardCopy.closedBody : teamPickCardCopy.body}</p>
      {list !== null && list.teams.length === 0 && <p className={shellStyles.fine}>{teamPickCardCopy.noTeams}</p>}
      {list !== null && list.teams.length > 0 && (
        <div className={styles.tiles}>
          {list.teams.map((team) => {
            const theme = themeById.get(team.id);
            const tile = resolveTeamTile(team, {
              shownPick: pick.shownPick,
              seatCap: list.seatCap,
              picksClosed,
              isPending: pick.isPending
            });
            const isFull = tile.state === "full";

            return (
              <button
                key={team.id}
                type="button"
                className={TILE_CLASS_BY_STATE[tile.state]}
                aria-pressed={tile.state === "picked"}
                aria-label={teamPickCardCopy.tileLabel(team.name, team.members.length, list.seatCap, isFull)}
                disabled={tile.isDisabled}
                data-testid="team-tile"
                data-team-name={team.name}
                data-team-color={theme?.colorToken ?? "none"}
                data-tile-state={tile.state}
                onClick={(): void => void pick.pick(team.name)}
              >
                {theme !== undefined && (
                  <span className={`${styles.tileWash} ${theme.colorVariant.splitColumnLeadBgClassName}`} aria-hidden />
                )}
                {isFull && (
                  <span className={`${shellStyles.pillDim} ${styles.fullPill}`}>{teamPickCardCopy.full}</span>
                )}
                {team.members.length === 0 ? (
                  <span className={styles.membersEmpty} aria-hidden />
                ) : (
                  <span className={styles.members}>
                    {team.members.map((member) => (
                      <span
                        key={member.guestId}
                        className={styles.member}
                        data-testid="team-member"
                        data-guest-name={member.displayName}
                      >
                        <PortalHeadBird
                          name={member.displayName}
                          headSrc={resolveMemberHeadSrc(member)}
                          theme={theme}
                          size="tiny"
                          label={teamPickCardCopy.memberBirdLabel(member.displayName)}
                        />
                      </span>
                    ))}
                  </span>
                )}
                {theme === undefined ? (
                  <span className={styles.teamNamePlain}>{team.name}</span>
                ) : (
                  <TeamWordmark name={team.name} theme={theme} sizeClassName={styles.teamName} />
                )}
                <span className={styles.seats} data-testid="team-seats">
                  {teamPickCardCopy.seats(team.members.length, list.seatCap)}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <p className={`${isError ? shellStyles.statusError : shellStyles.status} ${styles.statusLine}`} role="status">
        {statusText}
      </p>
    </section>
  );
};
