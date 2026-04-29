import type { RoomState } from "@wingnight/shared";

import { selectHeaderContext } from "./selectHeaderContext";
import * as styles from "./styles";

type HostMiniRailProps = {
  roomState: RoomState | null;
  teamNameByTeamId: Map<string, string>;
};

export const HostMiniRail = ({
  roomState,
  teamNameByTeamId
}: HostMiniRailProps): JSX.Element => {
  const headerContext = selectHeaderContext(roomState, teamNameByTeamId);

  return (
    <header className={styles.container}>
      <span className={styles.strong}>{headerContext.roundLabel}</span>
      {headerContext.roundIntroSauce !== null && (
        <>
          <span className={styles.divider} aria-hidden />
          <span className={styles.strong}>{headerContext.roundIntroSauce}</span>
        </>
      )}
      {headerContext.roundIntroMinigame !== null && (
        <>
          <span className={styles.divider} aria-hidden />
          <span className={styles.strong}>{headerContext.roundIntroMinigame}</span>
        </>
      )}
      {headerContext.activeTeamName !== null && (
        <>
          <span className={styles.divider} aria-hidden />
          <span className={styles.teamPill}>
            <span className={styles.teamDot} aria-hidden />
            {headerContext.activeTeamName}
          </span>
        </>
      )}
    </header>
  );
};
