import type { RoomState } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import { selectHeaderContext } from "./selectHeaderContext";
import * as styles from "./styles";

type HostPanelHeaderProps = {
  roomState: RoomState | null;
  teamNameByTeamId: Map<string, string>;
};

export const HostPanelHeader = ({
  roomState,
  teamNameByTeamId
}: HostPanelHeaderProps): JSX.Element => {
  const headerContext = selectHeaderContext(roomState, teamNameByTeamId);

  return (
    <header className={styles.container}>
      <p className={styles.kicker}>{hostControlPanelCopy.headerKickerLabel}</p>
      <h1 className={styles.heading}>{headerContext.phaseTitle}</h1>
      <p className={styles.subtext}>{headerContext.phaseDescription}</p>

      <div className={styles.contextRow}>
        <ContextPill
          label={hostControlPanelCopy.headerRoundContextTitle}
          value={headerContext.roundLabel}
        />
        {headerContext.roundIntroSauce !== null && (
          <ContextPill
            label={hostControlPanelCopy.headerSauceContextTitle}
            value={headerContext.roundIntroSauce}
          />
        )}
        {headerContext.roundIntroMinigame !== null && (
          <ContextPill
            label={hostControlPanelCopy.headerMinigameContextTitle}
            value={headerContext.roundIntroMinigame}
          />
        )}
        {headerContext.activeTeamName !== null && (
          <ContextPill
            label={hostControlPanelCopy.headerActiveTeamContextTitle}
            value={headerContext.activeTeamName}
          />
        )}
      </div>
    </header>
  );
};

type ContextPillProps = {
  label: string;
  value: string;
};

const ContextPill = ({ label, value }: ContextPillProps): JSX.Element => {
  return (
    <p className={styles.contextPill}>
      <span className={styles.contextLabel}>{label}</span>
      <span className={styles.contextValue}>{value}</span>
    </p>
  );
};
