import type { TeamTheme } from "@wingnight/shared";
import type { PortalTeam, PortalTeamMember } from "@wingnight/shared/guestPortal";

import { AdminTeamMember } from "../AdminTeamMember";
import * as styles from "./styles";

type MemberListProps = {
  members: PortalTeamMember[];
  // The column's team, themed; none for the unseated.
  theme: TeamTheme | undefined;
  currentTeamName: string | null;
  teams: PortalTeam[];
  isBusy: boolean;
  emptyText: string;
  onMove: (guestId: string, teamName: string | null) => Promise<void>;
};

// One column's guests on the board, each with their move menu, or the line that says the column
// is empty. The team columns and the unseated column are the same list with a different theme.
export const MemberList = ({
  members,
  theme,
  currentTeamName,
  teams,
  isBusy,
  emptyText,
  onMove
}: MemberListProps): JSX.Element =>
  members.length === 0 ? (
    <p className={styles.empty}>{emptyText}</p>
  ) : (
    <ul className={styles.members}>
      {members.map((member) => (
        <AdminTeamMember
          key={member.guestId}
          member={member}
          theme={theme}
          currentTeamName={currentTeamName}
          teams={teams}
          isBusy={isBusy}
          onMove={(teamName): Promise<void> => onMove(member.guestId, teamName)}
        />
      ))}
    </ul>
  );
