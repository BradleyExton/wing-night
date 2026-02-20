import { useEffect, useMemo, useState } from "react";
import type {
  MinigameDevManifest,
  MinigameDevScenario
} from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

import { DisplayBoard } from "../DisplayBoard";
import { HostControlPanel } from "../HostControlPanel";
import { resolveMinigameDevManifest } from "../../minigames/registry";
import { SandboxControls } from "./SandboxControls";
import { buildSandboxRoomState } from "./buildSandboxRoomState";
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
  scenarioHostView: MinigameDevScenario["minigameHostView"];
  scenarioDisplayView: MinigameDevScenario["minigameDisplayView"];
} => {
  const activeScenario = resolveScenarioById(devManifest.scenarios, knobsState.scenarioId);
  const scenarioHostView = structuredClone(activeScenario.minigameHostView);
  const scenarioDisplayView = structuredClone(activeScenario.minigameDisplayView);

  applyTriviaKnobs(scenarioHostView, scenarioDisplayView, knobsState);

  return {
    scenarioHostView,
    scenarioDisplayView
  };
};

export const MinigameDevSandbox = ({
  minigameType
}: MinigameDevSandboxProps): JSX.Element => {
  const devManifest = resolveMinigameDevManifest(minigameType);

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

  if (!devManifest || devManifest.scenarios.length === 0) {
    return (
      <main className={styles.container}>
        <div className={styles.headingBlock}>
          <h1 className={styles.heading}>{minigameDevSandboxCopy.title}</h1>
          <p className={styles.description}>{minigameDevSandboxCopy.noScenarioLabel}</p>
        </div>
      </main>
    );
  }

  const { scenarioHostView, scenarioDisplayView } = resolveSandboxModel(
    devManifest,
    knobsState
  );

  const previewRoomState = buildSandboxRoomState({
    minigameType,
    minigamePhase: knobsState.phase,
    activeTeamName: knobsState.activeTeamName,
    minigameHostView: scenarioHostView,
    minigameDisplayView: scenarioDisplayView
  });

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
          <HostControlPanel roomState={previewRoomState} />
        </div>
        <div className={styles.previewCard}>
          <header className={styles.previewHeader}>
            {minigameDevSandboxCopy.displayPreviewLabel}
          </header>
          <DisplayBoard roomState={previewRoomState} />
        </div>
      </section>
    </main>
  );
};
