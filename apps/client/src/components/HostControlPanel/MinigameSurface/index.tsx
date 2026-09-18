import { type MinigameHostView, type MinigameType } from "@wingnight/shared";
import type {
  MinigameSurfacePhase,
  SerializableValue
} from "@wingnight/minigames-core";

import { resolveMinigameRendererBundle } from "../../../minigames/registry";
import { useServerOrigin } from "../../../utils/useServerOrigin";
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
  // The host tablet is a different origin from the server as well, so a
  // minigame surface that renders a content-pack image needs the absolute one.
  const serverOrigin = useServerOrigin();
  const isTakeover = phase === "play";
  const containerClassName = isTakeover ? styles.takeoverCanvas : styles.group;

  if (minigameType === null) {
    return (
      <section className={containerClassName}>
        <div className={styles.groupHead}>
          <span>{hostControlPanelCopy.minigameSectionTitle}</span>
        </div>
        <p className={styles.description}>{hostControlPanelCopy.waitingStateLabel}</p>
      </section>
    );
  }

  const minigameRendererBundle = resolveMinigameRendererBundle(minigameType);

  if (minigameRendererBundle === null) {
    return (
      <section className={containerClassName}>
        <div className={styles.groupHead}>
          <span>{hostControlPanelCopy.minigameSectionTitle}</span>
        </div>
        <p className={styles.description}>
          {hostControlPanelCopy.minigameRendererUnavailableLabel(minigameType)}
        </p>
      </section>
    );
  }

  // Minigame-agnostic loading state: during play the host view can be null
  // for a beat while the server snapshot catches up after (re)connection.
  if (phase === "play" && minigameHostView === null) {
    return (
      <section className={containerClassName}>
        <div className={styles.groupHead}>
          <span>{hostControlPanelCopy.minigameSectionTitle}</span>
        </div>
        <p className={styles.description}>
          {hostControlPanelCopy.minigameWaitingForViewLabel}
        </p>
      </section>
    );
  }

  if (isTakeover) {
    return (
      <section className={containerClassName}>
        <div className={styles.takeoverInner}>
          <minigameRendererBundle.HostSurface
            phase={phase}
            minigameType={minigameType}
            minigameHostView={minigameHostView}
            activeTeamName={activeTeamName}
            teamNameByTeamId={teamNameByTeamId}
            canDispatchAction={canDispatchAction}
            onDispatchAction={onDispatchAction}
            serverOrigin={serverOrigin}
          />
        </div>
      </section>
    );
  }

  return (
    <section className={containerClassName}>
      {/* The hero already carries the "<minigame> is queued…" briefing, so the
          deck goes straight to the minigame's own intro rather than repeating it. */}
      <div className={styles.groupHead}>
        <span>{hostControlPanelCopy.minigameSectionTitle}</span>
      </div>
      <div className={styles.body}>
        <minigameRendererBundle.HostSurface
          phase={phase}
          minigameType={minigameType}
          minigameHostView={minigameHostView}
          activeTeamName={activeTeamName}
          teamNameByTeamId={teamNameByTeamId}
          canDispatchAction={canDispatchAction}
          onDispatchAction={onDispatchAction}
          serverOrigin={serverOrigin}
        />
      </div>
    </section>
  );
};
