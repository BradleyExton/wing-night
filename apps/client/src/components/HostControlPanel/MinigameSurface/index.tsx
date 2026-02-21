import { type MinigameHostView, type MinigameType } from "@wingnight/shared";
import type {
  MinigameSurfacePhase,
  SerializableValue
} from "@wingnight/minigames-core";

import { resolveMinigameRendererBundle } from "../../../minigames/registry";
import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type MinigameSurfaceProps = {
  phase: MinigameSurfacePhase;
  minigameType: MinigameType | null;
  minigameHostView: MinigameHostView | null;
  activeTeamName: string | null;
  teamNameByTeamId: Map<string, string>;
  canDispatchAction: boolean;
  onDispatchAction: (actionType: string, actionPayload: SerializableValue) => void;
};

export const MinigameSurface = ({
  phase,
  minigameType,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction
}: MinigameSurfaceProps): JSX.Element => {
  if (minigameType === null) {
    return (
      <section className={styles.shellCard}>
        <h2 className={styles.sectionHeading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.waitingStateLabel}
        </p>
      </section>
    );
  }

  const minigameRendererBundle = resolveMinigameRendererBundle(minigameType);

  if (minigameRendererBundle === null) {
    return (
      <section className={styles.shellCard}>
        <h2 className={styles.sectionHeading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.minigameRendererUnavailableLabel(minigameType)}
        </p>
      </section>
    );
  }

  if (phase === "play" && minigameType === "TRIVIA" && minigameHostView === null) {
    return (
      <section className={styles.shellCard}>
        <h2 className={styles.sectionHeading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.minigameWaitingForViewLabel}
        </p>
      </section>
    );
  }

  return (
    <section className={styles.shellCard}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
      <p className={styles.sectionDescription}>
        {phase === "intro"
          ? hostControlPanelCopy.minigameIntroDescription(minigameType)
          : hostControlPanelCopy.minigamePlayDescription(minigameType)}
      </p>
      <div className={styles.shellBody}>
        <minigameRendererBundle.HostSurface
          phase={phase}
          minigameType={minigameType}
          minigameHostView={minigameHostView}
          activeTeamName={activeTeamName}
          teamNameByTeamId={teamNameByTeamId}
          canDispatchAction={canDispatchAction}
          onDispatchAction={onDispatchAction}
        />
      </div>
    </section>
  );
};
