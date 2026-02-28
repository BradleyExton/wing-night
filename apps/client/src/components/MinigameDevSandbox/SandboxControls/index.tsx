import type {
  MinigameDevManifest,
  MinigameSurfacePhase
} from "@wingnight/minigames-core";
import type { MinigameType } from "@wingnight/shared";

import { minigameDevSandboxCopy } from "../copy";
import { resolveScenarioById } from "../sandboxState";
import type { SandboxKnobsState } from "../types";
import * as styles from "./styles";

type SandboxControlsProps = {
  minigameType: MinigameType;
  devManifest: MinigameDevManifest;
  knobsState: SandboxKnobsState;
  onKnobsStateChange: (updater: (previousState: SandboxKnobsState) => SandboxKnobsState) => void;
};

export const SandboxControls = ({
  minigameType,
  devManifest,
  knobsState,
  onKnobsStateChange
}: SandboxControlsProps): JSX.Element => {
  const isTrivia = minigameType === "TRIVIA";

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
            value={knobsState.scenarioId}
            onChange={(event): void => {
              const nextScenario = resolveScenarioById(
                devManifest.scenarios,
                event.target.value
              );
              const triviaHostView =
                nextScenario.minigameHostView?.minigame === "TRIVIA"
                  ? nextScenario.minigameHostView
                  : null;

              onKnobsStateChange((previousState) => ({
                ...previousState,
                scenarioId: nextScenario.id,
                phase: nextScenario.phase,
                activeTeamName: nextScenario.activeTeamName ?? "",
                promptVisible: triviaHostView?.currentPrompt !== null,
                promptQuestion: triviaHostView?.currentPrompt?.question ?? "",
                promptAnswer: triviaHostView?.currentPrompt?.answer ?? "",
                attemptsRemaining: triviaHostView?.attemptsRemaining ?? 0,
                pendingPointsForActiveTeam:
                  triviaHostView?.pendingPointsByTeamId[
                    triviaHostView.activeTurnTeamId ?? ""
                  ] ?? 0
              }));
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
            value={knobsState.phase}
            onChange={(event): void => {
              onKnobsStateChange((previousState) => ({
                ...previousState,
                phase: event.target.value as MinigameSurfacePhase
              }));
            }}
          >
            <option value="intro">{minigameDevSandboxCopy.introPhaseLabel}</option>
            <option value="play">{minigameDevSandboxCopy.playPhaseLabel}</option>
          </select>
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="active-team">
            {minigameDevSandboxCopy.activeTeamLabel}
          </label>
          <input
            id="active-team"
            className={styles.input}
            value={knobsState.activeTeamName}
            onChange={(event): void => {
              onKnobsStateChange((previousState) => ({
                ...previousState,
                activeTeamName: event.target.value
              }));
            }}
          />
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="minigame-type">
            {minigameDevSandboxCopy.minigameLabel}
          </label>
          <input id="minigame-type" className={styles.input} value={minigameType} disabled />
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="prompt-question">
            {minigameDevSandboxCopy.promptQuestionLabel}
          </label>
          <input
            id="prompt-question"
            className={styles.input}
            disabled={!isTrivia}
            value={knobsState.promptQuestion}
            onChange={(event): void => {
              onKnobsStateChange((previousState) => ({
                ...previousState,
                promptQuestion: event.target.value
              }));
            }}
          />
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="prompt-answer">
            {minigameDevSandboxCopy.promptAnswerLabel}
          </label>
          <input
            id="prompt-answer"
            className={styles.input}
            disabled={!isTrivia}
            value={knobsState.promptAnswer}
            onChange={(event): void => {
              onKnobsStateChange((previousState) => ({
                ...previousState,
                promptAnswer: event.target.value
              }));
            }}
          />
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="attempts">
            {minigameDevSandboxCopy.attemptsRemainingLabel}
          </label>
          <input
            id="attempts"
            className={styles.input}
            type="number"
            min={0}
            disabled={!isTrivia}
            value={knobsState.attemptsRemaining}
            onChange={(event): void => {
              onKnobsStateChange((previousState) => ({
                ...previousState,
                attemptsRemaining: Number.parseInt(event.target.value, 10) || 0
              }));
            }}
          />
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="pending">
            {minigameDevSandboxCopy.pendingPointsLabel}
          </label>
          <input
            id="pending"
            className={styles.input}
            type="number"
            min={0}
            disabled={!isTrivia}
            value={knobsState.pendingPointsForActiveTeam}
            onChange={(event): void => {
              onKnobsStateChange((previousState) => ({
                ...previousState,
                pendingPointsForActiveTeam:
                  Number.parseInt(event.target.value, 10) || 0
              }));
            }}
          />
        </div>
      </div>
      <label className={styles.checkboxRow} htmlFor="prompt-visible">
        <input
          id="prompt-visible"
          type="checkbox"
          checked={knobsState.promptVisible}
          disabled={!isTrivia}
          onChange={(event): void => {
            onKnobsStateChange((previousState) => ({
              ...previousState,
              promptVisible: event.target.checked
            }));
          }}
        />
        <span>{minigameDevSandboxCopy.promptVisibleLabel}</span>
      </label>
    </section>
  );
};
