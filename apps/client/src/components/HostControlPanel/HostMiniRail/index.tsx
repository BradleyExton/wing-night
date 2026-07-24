import { useHostRoomState } from "../../../context/RoomStateContext";
import { selectHostTeamMaps } from "../selectHostTeamMaps";
import { selectHeaderContext } from "./selectHeaderContext";
import * as styles from "./styles";

export const HostMiniRail = (): JSX.Element => {
  const roomState = useHostRoomState();
  const { teamNameByTeamId } = selectHostTeamMaps(roomState);
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
