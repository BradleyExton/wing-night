import { useState } from "react";
import type {
  MinigameDevManifest,
  MinigameRuntimePlugin,
  MinigameSurfacePhase,
  SerializableValue
} from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

import {
  resolveMinigameDevManifest,
  resolveMinigameRendererBundle,
  resolveMinigameRuntimePlugin
} from "../../minigames/registry";
import { SandboxControls } from "./SandboxControls";
import { minigameDevSandboxCopy } from "./copy";
import * as styles from "./styles";

type MinigameDevSandboxProps = {
  minigameType: MinigameType;
};

// Boots the same pure runtime plugin the server drives during a real game,
// seeded with the package's dev fixture (fake teams + sample content).
const initializeRuntimeState = (
  runtimePlugin: MinigameRuntimePlugin,
  devManifest: MinigameDevManifest
): SerializableValue => {
  return runtimePlugin.initialize({
    teamIds: [...devManifest.teamIds],
    activeRoundTeamId: devManifest.activeRoundTeamId,
    pointsMax: devManifest.pointsMax,
    pendingPointsByTeamId: { ...devManifest.pendingPointsByTeamId },
    rules: devManifest.rules,
    content: devManifest.content
  });
};

export const MinigameDevSandbox = ({
  minigameType
}: MinigameDevSandboxProps): JSX.Element => {
  const devManifest = resolveMinigameDevManifest(minigameType);
  const rendererBundle = resolveMinigameRendererBundle(minigameType);
  const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

  const [phase, setPhase] = useState<MinigameSurfacePhase>("play");
  const [runtimeState, setRuntimeState] = useState<SerializableValue>(() => {
    if (devManifest === null || runtimePlugin === null) {
      return null;
    }

    return initializeRuntimeState(runtimePlugin, devManifest);
  });

  if (devManifest === null || rendererBundle === null || runtimePlugin === null) {
    return (
      <main className={styles.container}>
        <div className={styles.headingBlock}>
          <h1 className={styles.heading}>{minigameDevSandboxCopy.title}</h1>
          <p className={styles.description}>
            {rendererBundle === null
              ? minigameDevSandboxCopy.noRendererLabel
              : minigameDevSandboxCopy.noRuntimeLabel}
          </p>
        </div>
      </main>
    );
  }

  const handleDispatchAction = (
    actionType: string,
    actionPayload: SerializableValue
  ): void => {
    setRuntimeState((previousState) =>
      runtimePlugin.reduceAction({
        state: previousState,
        envelope: { actionType, actionPayload },
        pointsMax: devManifest.pointsMax,
        rules: devManifest.rules,
        content: devManifest.content
      }).state
    );
  };

  const selectorInput = {
    state: runtimeState,
    rules: devManifest.rules,
    content: devManifest.content
  };
  const minigameHostView = runtimePlugin.selectHostView(selectorInput);
  const minigameDisplayView = runtimePlugin.selectDisplayView(selectorInput);
  const activeTeamName =
    devManifest.activeRoundTeamId === null
      ? null
      : (devManifest.teamNameByTeamId[devManifest.activeRoundTeamId] ?? null);
  const teamNameByTeamId = new Map(Object.entries(devManifest.teamNameByTeamId));
  const { HostSurface, DisplaySurface } = rendererBundle;

  return (
    <main className={styles.container}>
      <div className={styles.headingBlock}>
        <h1 className={styles.heading}>{minigameDevSandboxCopy.title}</h1>
        <p className={styles.description}>{minigameDevSandboxCopy.description}</p>
      </div>

      <SandboxControls
        minigameType={minigameType}
        phase={phase}
        onPhaseChange={setPhase}
        onReset={(): void => {
          setRuntimeState(initializeRuntimeState(runtimePlugin, devManifest));
        }}
      />

      <section className={styles.previewGrid}>
        <div className={`${styles.previewCard} ${styles.hostPreviewCard}`}>
          <header className={styles.previewHeader}>
            <span className={styles.previewHeaderLabel}>
              {minigameDevSandboxCopy.hostPreviewLabel}
            </span>
            <span className={styles.previewHeaderMeta}>
              {minigameDevSandboxCopy.hostPreviewMetaLabel}
            </span>
          </header>
          <div className={styles.hostViewport}>
            <div className={styles.hostViewportSurface}>
              <HostSurface
                phase={phase}
                minigameType={minigameType}
                minigameHostView={minigameHostView}
                activeTeamName={activeTeamName}
                teamNameByTeamId={teamNameByTeamId}
                canDispatchAction
                onDispatchAction={handleDispatchAction}
              />
            </div>
          </div>
        </div>
        <div className={`${styles.previewCard} ${styles.displayPreviewCard}`}>
          <header className={styles.previewHeader}>
            <span className={styles.previewHeaderLabel}>
              {minigameDevSandboxCopy.displayPreviewLabel}
            </span>
            <span className={styles.previewHeaderMeta}>
              {minigameDevSandboxCopy.displayPreviewMetaLabel}
            </span>
          </header>
          <div className={styles.displayViewport}>
            <div className={styles.displayViewportSurface}>
              <DisplaySurface
                phase={phase}
                minigameType={minigameType}
                minigameDisplayView={minigameDisplayView}
                activeTeamName={activeTeamName}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
