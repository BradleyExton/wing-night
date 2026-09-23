import { useState } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { RecreateSubState } from "@wingnight/shared";
import { TakeoverStage } from "@wingnight/surface";

import { RECREATE_MAX_PROMPT_LENGTH } from "../../runtime/index.js";
import { AppraisalPanel } from "./AppraisalPanel/index.js";
import { PromptComposer } from "./PromptComposer/index.js";
import { StudioFrames } from "./StudioFrames/index.js";
import { hostRecreateSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

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

// The scored beat's right column: what the ticks came to, and the prompt the
// target was actually painted from. It stands where the composer and the bench
// stand on the other two beats, instead of the row under the pictures that
// left the whole 3fr column empty.
const ScoredReveal = ({
  pointsAwarded,
  authoredPrompt
}: {
  pointsAwarded: number;
  authoredPrompt: string | null;
}): JSX.Element => (
  <div className={styles.reveal}>
    <span className={styles.pointsSeal}>
      <span className={styles.pointsSealValue}>
        {hostRecreateSurfaceCopy.pointsSealValue(pointsAwarded)}
      </span>
      <span className={styles.pointsSealLabel}>{hostRecreateSurfaceCopy.pointsSealLabel}</span>
    </span>
    {authoredPrompt !== null && (
      <div className={styles.revealPromptBlock}>
        <p className={styles.revealLabel}>{hostRecreateSurfaceCopy.authoredPromptLabel}</p>
        <p className={styles.revealPrompt}>{authoredPrompt}</p>
      </div>
    )}
  </div>
);

// RECREATE's host surface. At play it is a `<TakeoverStage>` with no deck
// (docs/takeover-layout-api.md §3): the body is a photograph beside either the
// prompt the team is typing or the prompt the host reads aloud while ticking
// ingredients, so a floating chip there covers a word or a tap target rather
// than a corner of scenery — and the grading bench is the WIDER of the two
// columns, which a 330px deck could not hold.
//
// It renders no rail, no header strip and no team chip of its own: `rail`
// arrives filled with the shell's `<HostMiniRail />`, which already says the
// round, the sauce and whose turn it is, which is why the
// `resolveActiveTeamName` helper all nine host surfaces had copied is no longer
// here. `clock` is forwarded untouched and draws nothing — RECREATE is
// `timerKey: null`, and an empty slot in the rail row takes no width, which is
// what retired this file's `pr-[clamp(9rem,15vw,12rem)]` reserve (§6).
export const HostRecreateSurface = ({
  phase,
  minigameHostView,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction,
  serverOrigin
}: MinigameHostRendererProps): JSX.Element => {
  const recreateHostView = minigameHostView?.minigame === "RECREATE" ? minigameHostView : null;
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

  // The intro beat is a panel in the host's own control deck rather than a
  // takeover — `rail` and `clock` are both null on it — so it gets the
  // briefing note and no chrome.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>{hostRecreateSurfaceCopy.introDescription}</p>
      </div>
    );
  }

  const trimmedDraft = draft.trim();

  // One beat-ender per beat, always in the foot row (§4, `actions`). RECREATE
  // is the only game with three of them, and they are three beats of one turn
  // rather than three buttons at once: write, grade, move on.
  const renderActions = (): JSX.Element | null => {
    if (recreateHostView === null || currentTarget === null) {
      return null;
    }

    if (subState === "writing") {
      return (
        <button
          className={styles.beatButton}
          type="button"
          disabled={!canDispatchAction || trimmedDraft.length === 0}
          onClick={(): void => {
            onDispatchAction("submitPrompt", { prompt: trimmedDraft });
          }}
        >
          {hostRecreateSurfaceCopy.submitButtonLabel}
        </button>
      );
    }

    if (subState === "judging") {
      return (
        <div className={styles.verdictRow}>
          <button
            className={styles.beatButton}
            type="button"
            disabled={!canDispatchAction}
            onClick={(): void => {
              onDispatchAction("lockScore", {});
            }}
          >
            {hostRecreateSurfaceCopy.lockButtonLabel}
          </button>
          <button
            className={styles.beatButtonQuiet}
            type="button"
            disabled={!canDispatchAction}
            onClick={(): void => {
              onDispatchAction("retryPrompt", {});
            }}
          >
            {hostRecreateSurfaceCopy.retryButtonLabel}
          </button>
        </div>
      );
    }

    if (isTurnComplete) {
      return (
        <p className={styles.turnCompleteNote}>{hostRecreateSurfaceCopy.turnCompleteLabel}</p>
      );
    }

    return (
      <button
        className={styles.beatButton}
        type="button"
        disabled={!canDispatchAction}
        onClick={(): void => {
          onDispatchAction("nextTarget", {});
        }}
      >
        {hostRecreateSurfaceCopy.nextTargetButtonLabel}
      </button>
    );
  };

  return (
    <TakeoverStage
      rail={rail}
      clock={clock}
      counter={
        targetsPerTurn > 0 ? (
          <p className={styles.counter}>
            {hostRecreateSurfaceCopy.targetLabel(targetNumber, targetsPerTurn)}
          </p>
        ) : null
      }
      actions={renderActions()}
    >
      {recreateHostView === null || currentTarget === null ? (
        <p className={styles.statusNote}>{hostRecreateSurfaceCopy.waitingTargetLabel}</p>
      ) : (
        <div className={styles.bench}>
          <StudioFrames recreateHostView={recreateHostView} serverOrigin={serverOrigin} />
          {subState === "writing" && (
            <PromptComposer
              draft={draft}
              onDraftChange={(nextDraft): void => {
                setDraftState({ draftKey, draft: nextDraft });
              }}
              maxLength={RECREATE_MAX_PROMPT_LENGTH}
              label={hostRecreateSurfaceCopy.composerLabel}
              placeholder={hostRecreateSurfaceCopy.composerPlaceholder}
              counterLabel={hostRecreateSurfaceCopy.composerCounter}
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
          {subState === "scored" && (
            <ScoredReveal
              pointsAwarded={recreateHostView.lastPointsAwarded ?? 0}
              authoredPrompt={recreateHostView.checklist?.authoredPrompt ?? null}
            />
          )}
        </div>
      )}
    </TakeoverStage>
  );
};
