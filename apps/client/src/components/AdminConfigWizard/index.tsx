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
import { PromptPacksStep } from "./PromptPacksStep";
import { ReviewStep } from "./ReviewStep";
import { RosterStep } from "./RosterStep";
import { useConfigWizard } from "./useConfigWizard";
import * as styles from "./styles";

type AdminConfigWizardProps = {
  socket: Socket<InboundSocketEvents, OutboundSocketEvents> | null;
};

const STEP_TITLES = [
  adminCopy.identityStepTitle,
  adminCopy.lineupStepTitle,
  adminCopy.clocksStepTitle,
  adminCopy.rosterStepTitle,
  adminCopy.promptPacksStepTitle,
  adminCopy.reviewStepTitle
] as const;

const LAST_STEP_INDEX = STEP_TITLES.length - 1;

export const AdminConfigWizard = ({
  socket
}: AdminConfigWizardProps): JSX.Element => {
  const wizard = useConfigWizard(socket);
  const [stepIndex, setStepIndex] = useState(0);
  const { draft, editFile, isLocked, issueMessagesByFile } = wizard;

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

        {isLocked && (
          <p className={styles.lockBanner}>
            {adminCopy.lockedBannerTitle}
            <span className={styles.lockBannerHint}>
              {adminCopy.lockedBannerHint}
            </span>
          </p>
        )}

        {wizard.errorMessage !== null && !isLocked && (
          <p className={styles.errorBanner} role="alert">
            {wizard.errorMessage}
          </p>
        )}

        {draft === null ? (
          <p className={styles.status}>{adminCopy.loadingLabel}</p>
        ) : (
          <div className={styles.stepBody}>
            {stepIndex === 0 && (
              <IdentityStep
                gameConfig={draft.gameConfig}
                issueMessagesByPath={issueMessagesByFile.gameConfig}
                isLocked={isLocked}
                onNameChange={(name): void => {
                  editFile("gameConfig", (previous) =>
                    setGameConfigName(previous, name)
                  );
                }}
              />
            )}

            {stepIndex === 1 && (
              <LineupStep
                gameConfig={draft.gameConfig}
                issueMessagesByPath={issueMessagesByFile.gameConfig}
                isLocked={isLocked}
                onRoundChange={(roundIndex, edit): void => {
                  editFile("gameConfig", (previous) =>
                    setRoundField(previous, roundIndex, edit)
                  );
                }}
                onAddRound={(): void => {
                  editFile("gameConfig", addRound);
                }}
                onRemoveRound={(roundIndex): void => {
                  editFile("gameConfig", (previous) =>
                    removeRound(previous, roundIndex)
                  );
                }}
              />
            )}

            {stepIndex === 2 && (
              <ClocksScoringStep
                gameConfig={draft.gameConfig}
                issueMessagesByPath={issueMessagesByFile.gameConfig}
                isLocked={isLocked}
                onTimerChange={(timerKey, seconds): void => {
                  editFile("gameConfig", (previous) =>
                    setTimer(previous, timerKey, seconds)
                  );
                }}
                onScoringChange={(edit): void => {
                  editFile("gameConfig", (previous) => setScoring(previous, edit));
                }}
              />
            )}

            {stepIndex === 3 && (
              <RosterStep
                players={draft.players}
                teams={draft.teams}
                playerIssueMessagesByPath={issueMessagesByFile.players}
                teamIssueMessagesByPath={issueMessagesByFile.teams}
                isLocked={isLocked}
                onPlayersChange={(players): void => {
                  editFile("players", () => players);
                }}
                onTeamsChange={(teams): void => {
                  editFile("teams", () => teams);
                }}
              />
            )}

            {stepIndex === 4 && (
              <PromptPacksStep
                trivia={draft.trivia}
                drawing={draft.drawing}
                geoPromptCount={wizard.geoPromptCount}
                triviaIssueMessagesByPath={issueMessagesByFile.trivia}
                drawingIssueMessagesByPath={issueMessagesByFile.drawing}
                isLocked={isLocked}
                onTriviaChange={(trivia): void => {
                  editFile("trivia", () => trivia);
                }}
                onDrawingChange={(drawing): void => {
                  editFile("drawing", () => drawing);
                }}
              />
            )}

            {stepIndex === LAST_STEP_INDEX && (
              <ReviewStep
                draft={draft}
                geoPromptCount={wizard.geoPromptCount}
                isLocked={isLocked}
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
