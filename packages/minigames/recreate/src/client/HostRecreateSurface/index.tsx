import { useState } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import {
  resolveContentAssetSrc,
  type RecreateAttempt,
  type RecreateMinigameHostView,
  type RecreateSubState
} from "@wingnight/shared";

import { RECREATE_MAX_PROMPT_LENGTH } from "../../runtime/index.js";
import { AppraisalPanel } from "./AppraisalPanel/index.js";
import { PromptComposer } from "./PromptComposer/index.js";
import { hostRecreateSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const resolveActiveTeamName = ({
  minigameHostView,
  teamNameByTeamId,
  activeTeamName
}: Pick<
  MinigameHostRendererProps,
  "minigameHostView" | "teamNameByTeamId" | "activeTeamName"
>): string => {
  if (minigameHostView?.activeTurnTeamId) {
    return (
      teamNameByTeamId.get(minigameHostView.activeTurnTeamId) ??
      hostRecreateSurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostRecreateSurfaceCopy.noAssignedTeamLabel;
};

// Counts the target the host is LOOKING AT, not the one the turn has reached.
// A scored target stays on the tablet — its seal and the real prompt — until
// "Next target", so the count must not run ahead of that reveal.
export const resolveRecreateTargetNumber = (
  subState: RecreateSubState,
  targetsCompletedThisTurn: number,
  targetsPerTurn: number
): number => {
  const targetOnScreen =
    subState === "scored" ? targetsCompletedThisTurn : targetsCompletedThisTurn + 1;

  return Math.min(Math.max(targetOnScreen, 1), targetsPerTurn);
};

const Frame = ({
  caption,
  imageSrc,
  alt,
  serverOrigin,
  placeholder,
  isBusy = false
}: {
  caption: string;
  imageSrc: string | null;
  alt: string;
  serverOrigin: string | null;
  placeholder?: string;
  isBusy?: boolean;
}): JSX.Element => {
  const resolvedSrc = imageSrc === null ? null : resolveContentAssetSrc(imageSrc, serverOrigin);

  return (
    <figure className={styles.frame}>
      <div className={styles.framePicture}>
        {resolvedSrc !== null ? (
          <img className={styles.framePhoto} src={resolvedSrc} alt={alt} />
        ) : (
          <div className={isBusy ? styles.framePlaceholderBusy : styles.framePlaceholder}>
            {placeholder ?? ""}
          </div>
        )}
      </div>
      <figcaption className={styles.frameCaption}>{caption}</figcaption>
    </figure>
  );
};

const resolveAttemptPlaceholder = (attempt: RecreateAttempt): string => {
  switch (attempt.status) {
    case "generating":
      return hostRecreateSurfaceCopy.attemptGeneratingLabel;
    case "failed":
      return hostRecreateSurfaceCopy.attemptFailedLabel(attempt.failureReason ?? "");
    case "skipped":
      return hostRecreateSurfaceCopy.attemptSkippedLabel;
    case "ready":
      return hostRecreateSurfaceCopy.attemptReadyLabel;
  }
};

const StudioFrames = ({
  recreateHostView,
  serverOrigin
}: {
  recreateHostView: RecreateMinigameHostView;
  serverOrigin: string | null;
}): JSX.Element | null => {
  const { currentTarget, attempt, subState } = recreateHostView;

  if (currentTarget === null) {
    return null;
  }

  return (
    <div className={subState === "writing" ? styles.frames : styles.framesPair}>
      <Frame
        caption={hostRecreateSurfaceCopy.targetCaption}
        imageSrc={currentTarget.targetImageSrc}
        alt={currentTarget.title}
        serverOrigin={serverOrigin}
      />
      {subState === "writing" ? (
        currentTarget.sourceImageSrc !== null && (
          <Frame
            caption={hostRecreateSurfaceCopy.originalCaption}
            imageSrc={currentTarget.sourceImageSrc}
            alt={currentTarget.title}
            serverOrigin={serverOrigin}
          />
        )
      ) : (
        <Frame
          caption={hostRecreateSurfaceCopy.attemptCaption}
          imageSrc={attempt?.imageSrc ?? null}
          alt={attempt?.prompt ?? currentTarget.title}
          serverOrigin={serverOrigin}
          placeholder={attempt === null ? undefined : resolveAttemptPlaceholder(attempt)}
          isBusy={attempt?.status === "generating"}
        />
      )}
    </div>
  );
};

export const HostRecreateSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction,
  serverOrigin
}: MinigameHostRendererProps): JSX.Element => {
  const recreateHostView =
    minigameHostView?.minigame === "RECREATE" ? minigameHostView : null;
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const currentTarget = recreateHostView?.currentTarget ?? null;
  const subState = recreateHostView?.subState ?? "writing";
  const targetsPerTurn = recreateHostView?.targetsPerTurn ?? 0;
  const targetsCompleted = recreateHostView?.targetsCompletedThisTurn ?? 0;
  const isTurnComplete = subState === "scored" && targetsCompleted >= targetsPerTurn;
  const targetNumber = resolveRecreateTargetNumber(subState, targetsCompleted, targetsPerTurn);
  // The draft belongs to one target of one turn: a fresh target starts blank,
  // while a rewrite of the same one (after "let them rewrite") keeps what the
  // team already typed. Keyed rather than reset in an effect so the surface
  // never renders a stale draft for a beat.
  const draftKey = `${currentTarget?.id ?? ""}:${targetsCompleted}`;
  const [draftState, setDraftState] = useState({ draftKey, draft: "" });
  const draft = draftState.draftKey === draftKey ? draftState.draft : "";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.headerTitle}>{hostRecreateSurfaceCopy.studioTitle}</p>
        {isPlayPhase && targetsPerTurn > 0 && (
          <p className={styles.headerMeta}>
            {hostRecreateSurfaceCopy.targetLabel(targetNumber, targetsPerTurn)}
          </p>
        )}
      </header>
      <p className={styles.teamLine}>
        {hostRecreateSurfaceCopy.teamPrefix}
        <span className={styles.teamName}>{resolvedActiveTeamName}</span>
      </p>
      {!isPlayPhase && (
        <p className={styles.statusNote}>{hostRecreateSurfaceCopy.introDescription}</p>
      )}
      {isPlayPhase && currentTarget === null && (
        <p className={styles.statusNote}>{hostRecreateSurfaceCopy.waitingTargetLabel}</p>
      )}
      {isPlayPhase && recreateHostView !== null && currentTarget !== null && (
        <div className={styles.stageRow}>
          <StudioFrames recreateHostView={recreateHostView} serverOrigin={serverOrigin} />
          {subState === "writing" && (
            <PromptComposer
              draft={draft}
              onDraftChange={(nextDraft): void => {
                setDraftState({ draftKey, draft: nextDraft });
              }}
              maxLength={RECREATE_MAX_PROMPT_LENGTH}
              canSubmit={canDispatchAction}
              label={hostRecreateSurfaceCopy.composerLabel}
              placeholder={hostRecreateSurfaceCopy.composerPlaceholder}
              counterLabel={hostRecreateSurfaceCopy.composerCounter}
              submitLabel={hostRecreateSurfaceCopy.submitButtonLabel}
              onSubmit={(prompt): void => {
                onDispatchAction("submitPrompt", { prompt });
              }}
            />
          )}
          {subState === "judging" &&
            recreateHostView.attempt !== null &&
            recreateHostView.checklist !== null && (
              <AppraisalPanel
                attempt={recreateHostView.attempt}
                checklist={recreateHostView.checklist}
                pointsPerIngredient={recreateHostView.pointsPerIngredient}
                canDispatchAction={canDispatchAction}
                onDispatchAction={onDispatchAction}
              />
            )}
        </div>
      )}
      {isPlayPhase && subState === "scored" && recreateHostView !== null && (
        <div className={styles.scoredRow}>
          <span className={styles.pointsSeal}>
            <span className={styles.pointsSealValue}>
              {hostRecreateSurfaceCopy.pointsSealValue(recreateHostView.lastPointsAwarded ?? 0)}
            </span>
            <span className={styles.pointsSealLabel}>
              {hostRecreateSurfaceCopy.pointsSealLabel}
            </span>
          </span>
          {recreateHostView.checklist !== null && (
            <div className={styles.reveal}>
              <p className={styles.revealLabel}>{hostRecreateSurfaceCopy.authoredPromptLabel}</p>
              <p className={styles.revealPrompt}>{recreateHostView.checklist.authoredPrompt}</p>
            </div>
          )}
        </div>
      )}
      {isPlayPhase && subState === "scored" && !isTurnComplete && (
        <button
          className={styles.nextTargetButton}
          type="button"
          disabled={!canDispatchAction}
          onClick={(): void => {
            onDispatchAction("nextTarget", {});
          }}
        >
          {hostRecreateSurfaceCopy.nextTargetButtonLabel}
        </button>
      )}
      {isPlayPhase && isTurnComplete && (
        <p className={styles.statusNote}>{hostRecreateSurfaceCopy.turnCompleteLabel}</p>
      )}
    </div>
  );
};
