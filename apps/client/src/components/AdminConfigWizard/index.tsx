import { useState } from "react";
import type { Socket } from "socket.io-client";

import { adminCopy } from "../../copy/admin";
import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { ClocksScoringStep } from "./ClocksScoringStep";
import {
  addRound,
  removeRound,
  setGameConfigName,
  setRoundField,
  setScoring,
  setTimer
} from "./gameConfigDraft";
import { IdentityStep } from "./IdentityStep";
import { LineupStep } from "./LineupStep";
import { ReviewStep } from "./ReviewStep";
import { useConfigWizard } from "./useConfigWizard";
import * as styles from "./styles";

type AdminConfigWizardProps = {
  socket: Socket<InboundSocketEvents, OutboundSocketEvents> | null;
};

const STEP_TITLES = [
  adminCopy.identityStepTitle,
  adminCopy.lineupStepTitle,
  adminCopy.clocksStepTitle,
  adminCopy.reviewStepTitle
] as const;

const LAST_STEP_INDEX = STEP_TITLES.length - 1;

export const AdminConfigWizard = ({
  socket
}: AdminConfigWizardProps): JSX.Element => {
  const wizard = useConfigWizard(socket);
  const [stepIndex, setStepIndex] = useState(0);
  const { gameConfig } = wizard;

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div>
          <p className={styles.eyebrow}>{adminCopy.eyebrow}</p>
          <h1 className={styles.headline}>{STEP_TITLES[stepIndex]}</h1>
        </div>

        <nav className={styles.stepRail} aria-label={adminCopy.stepRailLabel}>
          {STEP_TITLES.map((title, index) => (
            <button
              key={title}
              type="button"
              className={`${styles.stepChip} ${
                index === stepIndex
                  ? styles.stepChipActive
                  : index < stepIndex
                    ? styles.stepChipDone
                    : ""
              }`}
              onClick={(): void => {
                setStepIndex(index);
              }}
            >
              <span className={styles.stepIndex}>
                {adminCopy.stepPositionLabel(index + 1)}
              </span>
              {title}
            </button>
          ))}
        </nav>

        {wizard.isLocked && (
          <p className={styles.lockBanner}>
            {adminCopy.lockedBannerTitle}
            <span className={styles.lockBannerHint}>
              {adminCopy.lockedBannerHint}
            </span>
          </p>
        )}

        {wizard.errorMessage !== null && !wizard.isLocked && (
          <p className={styles.errorBanner} role="alert">
            {wizard.errorMessage}
          </p>
        )}

        {gameConfig === null ? (
          <p className={styles.status}>{adminCopy.loadingLabel}</p>
        ) : (
          <div className={styles.stepBody}>
            {stepIndex === 0 && (
              <IdentityStep
                gameConfig={gameConfig}
                issueMessagesByPath={wizard.issueMessagesByPath}
                isLocked={wizard.isLocked}
                onNameChange={(name): void => {
                  wizard.editGameConfig((previous) =>
                    setGameConfigName(previous, name)
                  );
                }}
              />
            )}

            {stepIndex === 1 && (
              <LineupStep
                gameConfig={gameConfig}
                issueMessagesByPath={wizard.issueMessagesByPath}
                isLocked={wizard.isLocked}
                onRoundChange={(roundIndex, edit): void => {
                  wizard.editGameConfig((previous) =>
                    setRoundField(previous, roundIndex, edit)
                  );
                }}
                onAddRound={(): void => {
                  wizard.editGameConfig(addRound);
                }}
                onRemoveRound={(roundIndex): void => {
                  wizard.editGameConfig((previous) =>
                    removeRound(previous, roundIndex)
                  );
                }}
              />
            )}

            {stepIndex === 2 && (
              <ClocksScoringStep
                gameConfig={gameConfig}
                issueMessagesByPath={wizard.issueMessagesByPath}
                isLocked={wizard.isLocked}
                onTimerChange={(timerKey, seconds): void => {
                  wizard.editGameConfig((previous) =>
                    setTimer(previous, timerKey, seconds)
                  );
                }}
                onScoringChange={(edit): void => {
                  wizard.editGameConfig((previous) => setScoring(previous, edit));
                }}
              />
            )}

            {stepIndex === LAST_STEP_INDEX && (
              <ReviewStep
                gameConfig={gameConfig}
                roster={wizard.roster}
                isLocked={wizard.isLocked}
                isDirty={wizard.isDirty}
                hasBlockingIssues={wizard.hasBlockingIssues}
                didApply={wizard.didApply}
                onApply={wizard.apply}
              />
            )}
          </div>
        )}

        <div className={styles.navRow}>
          <button
            type="button"
            className={styles.backButton}
            disabled={stepIndex === 0}
            onClick={(): void => {
              setStepIndex((previous) => Math.max(0, previous - 1));
            }}
          >
            {adminCopy.backLabel}
          </button>
          {stepIndex < LAST_STEP_INDEX && (
            <button
              type="button"
              className={styles.continueButton}
              onClick={(): void => {
                setStepIndex((previous) => Math.min(LAST_STEP_INDEX, previous + 1));
              }}
            >
              {adminCopy.continueLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
