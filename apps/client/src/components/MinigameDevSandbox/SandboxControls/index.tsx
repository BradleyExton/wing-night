import type { MinigameSurfacePhase } from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

import { minigameDevSandboxCopy } from "../copy";
import * as styles from "./styles";

type SandboxControlsProps = {
  minigameType: MinigameType;
  phase: MinigameSurfacePhase;
  onPhaseChange: (phase: MinigameSurfacePhase) => void;
  onReset: () => void;
};

export const SandboxControls = ({
  minigameType,
  phase,
  onPhaseChange,
  onReset
}: SandboxControlsProps): JSX.Element => {
  return (
    <section className={styles.controlsCard}>
      <div className={styles.controlsGrid}>
        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="minigame-type">
            {minigameDevSandboxCopy.minigameLabel}
          </label>
          <input id="minigame-type" className={styles.input} value={minigameType} disabled />
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="phase">
            {minigameDevSandboxCopy.phaseLabel}
          </label>
          <select
            id="phase"
            className={styles.input}
            value={phase}
            onChange={(event): void => {
              onPhaseChange(event.target.value as MinigameSurfacePhase);
            }}
          >
            <option value="intro">{minigameDevSandboxCopy.introPhaseLabel}</option>
            <option value="play">{minigameDevSandboxCopy.playPhaseLabel}</option>
          </select>
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
