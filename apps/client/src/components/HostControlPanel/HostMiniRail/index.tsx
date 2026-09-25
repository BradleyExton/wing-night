import { useHostRoomState } from "../../../context/RoomStateContext";
import { selectHostTeamMaps } from "../selectHostTeamMaps";
import { selectHeaderContext } from "./selectHeaderContext";
import * as styles from "./styles";

export const HostMiniRail = (): JSX.Element => {
  const roomState = useHostRoomState();
  const { teamNameByTeamId, teamThemeByTeamId } = selectHostTeamMaps(roomState);
  const headerContext = selectHeaderContext(roomState, teamNameByTeamId);
  // The host's one copy of every team's kit already knows this colour
  // (docs/team-identity.md); the rail reads it rather than resolving a theme of
  // its own, the way every other host surface that draws a dot does.
  const activeTeamColorVariant =
    headerContext.activeTeamId === null
      ? null
      : (teamThemeByTeamId.get(headerContext.activeTeamId)?.colorVariant ?? null);
  const teamDotClassName =
    activeTeamColorVariant === null
      ? `${styles.teamDot} ${styles.teamDotUnassigned}`
      : `${styles.teamDot} ${activeTeamColorVariant.dotAccentClassName} ${activeTeamColorVariant.tintClassName}`;

  return (
    <header className={styles.container}>
      <span className={styles.strong}>{headerContext.roundLabel}</span>
      {headerContext.sauceLabel !== null && (
        <>
          <span className={styles.divider} aria-hidden />
          <span className={styles.strong}>{headerContext.sauceLabel}</span>
        </>
      )}
      {headerContext.minigameLabel !== null && (
        <>
          <span className={styles.divider} aria-hidden />
          <span className={styles.strong}>{headerContext.minigameLabel}</span>
        </>
      )}
      {headerContext.activeTeamName !== null && (
        <>
          <span className={styles.divider} aria-hidden />
          <span
            className={
              activeTeamColorVariant === null
                ? styles.teamPill
                : `${styles.teamPill} ${activeTeamColorVariant.tintClassName}`
            }
          >
            <span className={teamDotClassName} aria-hidden />
            {headerContext.activeTeamName}
          </span>
        </>
      )}
    </header>
  );
};
