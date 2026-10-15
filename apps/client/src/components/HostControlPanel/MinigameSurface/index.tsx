import type { ReactNode } from "react";
import { type MinigameHostView, type MinigameType } from "@wingnight/shared";
import type {
  MinigameHandset,
  MinigameSurfacePhase,
  SerializableValue
} from "@wingnight/minigames-core";

import { useMinigameRendererBundle } from "../../../minigames/useMinigameRendererBundle";
import { useServerOrigin } from "../../../utils/useServerOrigin";
import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type MinigameSurfaceProps = {
  phase: MinigameSurfacePhase;
  minigameType: MinigameType | null;
  minigameHostView: MinigameHostView | null;
  activeTeamName: string | null;
  teamNameByTeamId: Map<string, string>;
  // The takeover's shell-owned chrome, passed through to the minigame's own
  // host surface rather than drawn here: the rail and the clock belong in the
  // layout's rail row, and only the game knows whether its body is a
  // `<TakeoverStage>` or a `<TakeoverCanvas>`
  // (docs/takeover-layout-api.md §1). Both are null on the intro deck.
  rail: ReactNode;
  clock: ReactNode;
  canDispatchAction: boolean;
  onDispatchAction: (actionType: string, actionPayload: SerializableValue) => void;
  // Who plays the leg in hand (`resolveLegHandset`), or on the briefing who will
  // (`resolveBriefingHandset`), for the game's own "pass the tablet" copy.
  handset: MinigameHandset;
};

export const MinigameSurface = ({
  phase,
  minigameType,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction,
  handset
}: MinigameSurfaceProps): JSX.Element => {
  // The host tablet is a different origin from the server as well, so a
  // minigame surface that renders a content-pack image needs the absolute one.
  const serverOrigin = useServerOrigin();
  // Unconditional, above the early returns. In a real game the chunk is already
  // warm — HostControlPanel asked for it when the room named the round — so this
  // is a cache read, not a fetch.
  const minigameRendererLoad = useMinigameRendererBundle(minigameType);
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

  // The renderer chunk has not landed yet. Same wording as a host view that has
  // not arrived, because it is the same situation from the host's side: the
  // panel is a beat behind and is about to catch up — unless the chunk has
  // failed enough times that "catching up" is no longer an honest description,
  // in which case the host is told what actually happened and how to fix it.
  if (minigameRendererLoad.rendererBundle === null) {
    return (
      <section className={containerClassName}>
        <div className={styles.groupHead}>
          <span>{hostControlPanelCopy.minigameSectionTitle}</span>
        </div>
        <p className={styles.description}>
          {minigameRendererLoad.status === "unavailable"
            ? hostControlPanelCopy.minigameRendererUnavailableLabel(minigameType)
            : hostControlPanelCopy.minigameWaitingForViewLabel}
        </p>
      </section>
    );
  }

  const { HostSurface } = minigameRendererLoad.rendererBundle;

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
          <HostSurface
            phase={phase}
            minigameType={minigameType}
            minigameHostView={minigameHostView}
            activeTeamName={activeTeamName}
            teamNameByTeamId={teamNameByTeamId}
            rail={rail}
            clock={clock}
            canDispatchAction={canDispatchAction}
            onDispatchAction={onDispatchAction}
            serverOrigin={serverOrigin}
            seat="host"
            handset={handset}
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
        <HostSurface
          phase={phase}
          minigameType={minigameType}
          minigameHostView={minigameHostView}
          activeTeamName={activeTeamName}
          teamNameByTeamId={teamNameByTeamId}
          rail={rail}
          clock={clock}
          canDispatchAction={canDispatchAction}
          onDispatchAction={onDispatchAction}
          serverOrigin={serverOrigin}
          seat="host"
          handset={handset}
        />
      </div>
    </section>
  );
};
