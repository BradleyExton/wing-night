import { useEffect, useState } from "react";
import type {
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
import {
  createSandboxRuntimeState,
  reduceSandboxRuntimeState
} from "./runtimeSession";
import {
  resolveInitialViewState,
  resolveScenarioById,
  syncSandboxSearchParams
} from "./sandboxState";
import type { SandboxViewState } from "./types";
import * as styles from "./styles";

type MinigameDevSandboxProps = {
  minigameType: MinigameType;
};

export const MinigameDevSandbox = ({
  minigameType
}: MinigameDevSandboxProps): JSX.Element => {
  const devManifest = resolveMinigameDevManifest(minigameType);
  const rendererBundle = resolveMinigameRendererBundle(minigameType);
  const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);
  const hasScenarios = devManifest !== null && devManifest.scenarios.length > 0;

  const [viewState, setViewState] = useState<SandboxViewState>(() => {
    if (devManifest === null || !hasScenarios) {
      return { scenarioId: "", phase: "play" };
    }

    return resolveInitialViewState(devManifest);
  });

  const [runtimeState, setRuntimeState] = useState<SerializableValue>(() => {
    if (devManifest === null || runtimePlugin === null || !hasScenarios) {
      return null;
    }

    return createSandboxRuntimeState(
      runtimePlugin,
      devManifest.live,
      resolveScenarioById(devManifest.scenarios, viewState.scenarioId)
    );
  });

  useEffect(() => {
    if (devManifest === null) {
      return;
    }

    syncSandboxSearchParams(viewState);
  }, [devManifest, viewState]);

  if (
    devManifest === null ||
    !hasScenarios ||
    rendererBundle === null ||
    runtimePlugin === null
  ) {
    const unavailableLabel =
      rendererBundle === null
        ? minigameDevSandboxCopy.noRendererLabel
        : runtimePlugin === null
          ? minigameDevSandboxCopy.noRuntimeLabel
          : minigameDevSandboxCopy.noScenarioLabel;

    return (
      <main className={styles.container}>
        <div className={styles.headingBlock}>
          <h1 className={styles.heading}>{minigameDevSandboxCopy.title}</h1>
          <p className={styles.description}>{unavailableLabel}</p>
        </div>
      </main>
    );
  }

  const liveFixture = devManifest.live;
  const activeScenario = resolveScenarioById(
    devManifest.scenarios,
    viewState.scenarioId
  );

  const handleScenarioChange = (scenarioId: string): void => {
    const nextScenario = resolveScenarioById(devManifest.scenarios, scenarioId);

    setViewState({ scenarioId: nextScenario.id, phase: nextScenario.phase });
    setRuntimeState(
      createSandboxRuntimeState(runtimePlugin, liveFixture, nextScenario)
    );
  };

  const handlePhaseChange = (phase: MinigameSurfacePhase): void => {
    setViewState((previousState) => ({ ...previousState, phase }));
  };

  const handleReset = (): void => {
    setRuntimeState(
      createSandboxRuntimeState(runtimePlugin, liveFixture, activeScenario)
    );
  };

  const handleDispatchAction = (
    actionType: string,
    actionPayload: SerializableValue
  ): void => {
    setRuntimeState((previousState) =>
      reduceSandboxRuntimeState(
        runtimePlugin,
        liveFixture,
        previousState,
        actionType,
        actionPayload
      )
    );
  };

  const selectorInput = {
    state: runtimeState,
    rules: liveFixture.rules,
    content: liveFixture.content
  };
  const minigameHostView = runtimePlugin.selectHostView(selectorInput);
  const minigameDisplayView = runtimePlugin.selectDisplayView(selectorInput);
  const activeTeamName =
    liveFixture.activeRoundTeamId === null
      ? null
      : (liveFixture.teamNameByTeamId[liveFixture.activeRoundTeamId] ?? null);
  const teamNameByTeamId = new Map(Object.entries(liveFixture.teamNameByTeamId));
  const { HostSurface, DisplaySurface } = rendererBundle;

  return (
    <main className={styles.container}>
      <div className={styles.headingBlock}>
        <h1 className={styles.heading}>{minigameDevSandboxCopy.title}</h1>
        <p className={styles.description}>{minigameDevSandboxCopy.description}</p>
      </div>

      <SandboxControls
        minigameType={minigameType}
        devManifest={devManifest}
        viewState={viewState}
        onScenarioChange={handleScenarioChange}
        onPhaseChange={handlePhaseChange}
        onReset={handleReset}
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
                phase={viewState.phase}
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
                phase={viewState.phase}
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
