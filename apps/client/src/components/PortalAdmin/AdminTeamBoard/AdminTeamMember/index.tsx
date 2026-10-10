import type { TeamTheme } from "@wingnight/shared";
import { resolveGuestAvatarRoute, type PortalTeam, type PortalTeamMember } from "@wingnight/shared/guestPortal";

import { PortalHeadBird } from "../../../PortalHeadBird";
import { adminTeamBoardCopy } from "../copy";
import { UNSEAT_KEY, findMoveTarget, resolveMoveTargets } from "../moveTargets";
import * as styles from "./styles";

type AdminTeamMemberProps = {
  member: PortalTeamMember;
  // The team they sit on, themed; none for the unseated.
  theme: TeamTheme | undefined;
  currentTeamName: string | null;
  teams: ReadonlyArray<Pick<PortalTeam, "id" | "name">>;
  isBusy: boolean;
  onMove: (teamName: string | null) => Promise<void>;
};

// One guest on the board: their bird in the column's kit, their name, and where Brad can move
// them. The menu is a native <select> so the phone's own picker does the work; picking an option
// is the move, and the select snaps back to its placeholder once the board has reloaded.
export const AdminTeamMember = ({
  member,
  theme,
  currentTeamName,
  teams,
  isBusy,
  onMove
}: AdminTeamMemberProps): JSX.Element => {
  const targets = resolveMoveTargets(teams, currentTeamName);
  const headSrc = member.headHash === null ? null : `${resolveGuestAvatarRoute(member.guestId)}?v=${member.headHash}`;

  return (
    <li className={styles.row} data-testid="admin-team-member" data-guest-name={member.displayName}>
      <span className={styles.bird}>
        <PortalHeadBird
          name={member.displayName}
          headSrc={headSrc}
          theme={theme}
          size="tiny"
          label={adminTeamBoardCopy.birdLabel(member.displayName)}
        />
      </span>
      <span className={styles.name}>{member.displayName}</span>
      <select
        className={styles.move}
        aria-label={adminTeamBoardCopy.moveLabel(member.displayName)}
        value=""
        disabled={isBusy || targets.length === 0}
        onChange={(event): void => {
          const target = findMoveTarget(targets, event.target.value);

          if (target !== undefined) {
            void onMove(target.teamName);
          }
        }}
      >
        <option value="" disabled>
          {adminTeamBoardCopy.movePlaceholder}
        </option>
        {targets.map((target) => (
          <option key={target.key} value={target.key}>
            {target.key === UNSEAT_KEY ? adminTeamBoardCopy.unseat : target.teamName}
          </option>
        ))}
      </select>
    </li>
  );
};
