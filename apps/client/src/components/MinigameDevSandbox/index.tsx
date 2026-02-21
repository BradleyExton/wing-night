import { useEffect, useMemo, useState } from "react";
import type {
  MinigameDevManifest,
  MinigameDevScenario
} from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

import {
  resolveMinigameDevManifest,
  resolveMinigameRendererBundle
} from "../../minigames/registry";
import { SandboxControls } from "./SandboxControls";
import { minigameDevSandboxCopy } from "./copy";
import {
  resolveInitialKnobsState,
  resolveInitialScenario,
  resolveScenarioById,
  syncSandboxSearchParams
} from "./sandboxState";
import type { SandboxKnobsState } from "./types";
import * as styles from "./styles";

type MinigameDevSandboxProps = {
  minigameType: MinigameType;
};

const applyTriviaKnobs = (
  scenarioHostView: MinigameDevScenario["minigameHostView"],
  scenarioDisplayView: MinigameDevScenario["minigameDisplayView"],
  knobsState: SandboxKnobsState
): void => {
  if (scenarioHostView?.minigame === "TRIVIA") {
    const activeTeamId = scenarioHostView.activeTurnTeamId ?? "team-alpha";

    scenarioHostView.attemptsRemaining = Math.max(0, knobsState.attemptsRemaining);
    scenarioHostView.pendingPointsByTeamId[activeTeamId] = Math.max(
      0,
      knobsState.pendingPointsForActiveTeam
    );
    scenarioHostView.currentPrompt = knobsState.promptVisible
      ? {
          id: scenarioHostView.currentPrompt?.id ?? "sandbox-trivia",
          question: knobsState.promptQuestion,
          answer: knobsState.promptAnswer
        }
      : null;
  }

  if (scenarioDisplayView?.minigame === "TRIVIA") {
    const activeTeamId = scenarioDisplayView.activeTurnTeamId ?? "team-alpha";

    scenarioDisplayView.pendingPointsByTeamId[activeTeamId] = Math.max(
      0,
      knobsState.pendingPointsForActiveTeam
    );
    scenarioDisplayView.currentPrompt = knobsState.promptVisible
      ? {
          id: scenarioDisplayView.currentPrompt?.id ?? "sandbox-trivia",
          question: knobsState.promptQuestion
        }
      : null;
  }
};

const resolveSandboxModel = (
  devManifest: MinigameDevManifest,
  knobsState: SandboxKnobsState
): {
  activeScenario: MinigameDevScenario;
  scenarioHostView: MinigameDevScenario["minigameHostView"];
  scenarioDisplayView: MinigameDevScenario["minigameDisplayView"];
} => {
  const activeScenario = resolveScenarioById(devManifest.scenarios, knobsState.scenarioId);
  const scenarioHostView = structuredClone(activeScenario.minigameHostView);
  const scenarioDisplayView = structuredClone(activeScenario.minigameDisplayView);

  applyTriviaKnobs(scenarioHostView, scenarioDisplayView, knobsState);

  return {
    activeScenario,
    scenarioHostView,
    scenarioDisplayView
  };
};

export const MinigameDevSandbox = ({
  minigameType
}: MinigameDevSandboxProps): JSX.Element => {
  const devManifest = resolveMinigameDevManifest(minigameType);
  const rendererBundle = resolveMinigameRendererBundle(minigameType);

  const initialState = useMemo(() => {
    if (!devManifest || devManifest.scenarios.length === 0) {
      return null;
    }

    const initialScenario = resolveInitialScenario(devManifest);

    return {
      initialScenario,
      initialKnobsState: resolveInitialKnobsState(initialScenario)
    };
  }, [devManifest]);

  const [knobsState, setKnobsState] = useState<SandboxKnobsState>(() => {
    if (initialState === null) {
      return {
        scenarioId: "",
        phase: "play",
        activeTeamName: "",
        promptVisible: false,
        promptQuestion: "",
        promptAnswer: "",
        attemptsRemaining: 0,
        pendingPointsForActiveTeam: 0
      };
    }

    return initialState.initialKnobsState;
  });

  useEffect(() => {
    if (devManifest === null) {
      return;
    }

    syncSandboxSearchParams(knobsState);
  }, [devManifest, knobsState]);

  if (!devManifest || devManifest.scenarios.length === 0 || rendererBundle === null) {
    return (
      <main className={styles.container}>
        <div className={styles.headingBlock}>
          <h1 className={styles.heading}>{minigameDevSandboxCopy.title}</h1>
          <p className={styles.description}>
            {rendererBundle === null
              ? minigameDevSandboxCopy.noRendererLabel
              : minigameDevSandboxCopy.noScenarioLabel}
          </p>
        </div>
      </main>
    );
  }

  const { activeScenario, scenarioHostView, scenarioDisplayView } = resolveSandboxModel(
    devManifest,
    knobsState
  );
  const activeTeamName =
    knobsState.activeTeamName.trim().length > 0
      ? knobsState.activeTeamName
      : activeScenario.activeTeamName;
  const teamNameByTeamId = new Map(Object.entries(activeScenario.teamNameByTeamId));
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
        knobsState={knobsState}
        onKnobsStateChange={(updater): void => {
          setKnobsState((previousState) => updater(previousState));
        }}
      />

      <section className={styles.previewGrid}>
        <div className={styles.previewCard}>
          <header className={styles.previewHeader}>
            {minigameDevSandboxCopy.hostPreviewLabel}
          </header>
          <HostSurface
            phase={knobsState.phase}
            minigameType={minigameType}
            minigameHostView={scenarioHostView}
            activeTeamName={activeTeamName}
            teamNameByTeamId={teamNameByTeamId}
            canDispatchAction={false}
            onDispatchAction={(): void => {
              return;
            }}
          />
        </div>
        <div className={styles.previewCard}>
          <header className={styles.previewHeader}>
            {minigameDevSandboxCopy.displayPreviewLabel}
          </header>
          <DisplaySurface
            phase={knobsState.phase}
            minigameType={minigameType}
            minigameDisplayView={scenarioDisplayView}
            activeTeamName={activeTeamName}
          />
        </div>
      </section>
    </main>
  );
};
