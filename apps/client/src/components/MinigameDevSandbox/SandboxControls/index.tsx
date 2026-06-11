import type {
  MinigameDevManifest,
  MinigameSurfacePhase
} from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

import { minigameDevSandboxCopy } from "../copy";
import type { SandboxViewState } from "../types";
import * as styles from "./styles";

type SandboxControlsProps = {
  minigameType: MinigameType;
  devManifest: MinigameDevManifest;
  viewState: SandboxViewState;
  onScenarioChange: (scenarioId: string) => void;
  onPhaseChange: (phase: MinigameSurfacePhase) => void;
  onReset: () => void;
};

export const SandboxControls = ({
  minigameType,
  devManifest,
  viewState,
  onScenarioChange,
  onPhaseChange,
  onReset
}: SandboxControlsProps): JSX.Element => {
  return (
    <section className={styles.controlsCard}>
      <div className={styles.controlsGrid}>
        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="scenario">
            {minigameDevSandboxCopy.scenarioLabel}
          </label>
          <select
            id="scenario"
            className={styles.input}
            value={viewState.scenarioId}
            onChange={(event): void => {
              onScenarioChange(event.target.value);
            }}
          >
            {devManifest.scenarios.map((scenario) => {
              return (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </option>
              );
            })}
          </select>
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="phase">
            {minigameDevSandboxCopy.phaseLabel}
          </label>
          <select
            id="phase"
            className={styles.input}
            value={viewState.phase}
            onChange={(event): void => {
              onPhaseChange(event.target.value as MinigameSurfacePhase);
            }}
          >
            <option value="intro">{minigameDevSandboxCopy.introPhaseLabel}</option>
            <option value="play">{minigameDevSandboxCopy.playPhaseLabel}</option>
          </select>
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="minigame-type">
            {minigameDevSandboxCopy.minigameLabel}
          </label>
          <input id="minigame-type" className={styles.input} value={minigameType} disabled />
        </div>

        <div className={styles.controlBlock}>
          <span className={styles.controlLabel}>
            {minigameDevSandboxCopy.sessionLabel}
          </span>
          <button
            className={styles.resetButton}
            type="button"
            onClick={(): void => {
              onReset();
            }}
          >
            {minigameDevSandboxCopy.resetButtonLabel}
          </button>
        </div>
      </div>
    </section>
  );
};
