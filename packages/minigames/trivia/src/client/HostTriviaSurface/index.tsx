import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { TriviaPrompt } from "@wingnight/shared";
import { TakeoverStage } from "@wingnight/surface";

import { hostTriviaSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// The same card on both beats, at two heights: the takeover's body slot has a
// definite height to fill, the intro deck's panel has not.
const renderPromptCard = (prompt: TriviaPrompt, className: string): JSX.Element => (
  <div className={className}>
    <div className={styles.promptSection}>
      <p className={styles.promptLabel}>{hostTriviaSurfaceCopy.questionLabel}</p>
      <p className={styles.promptValue}>{prompt.question}</p>
    </div>
    <div className={styles.answerSection}>
      <p className={styles.answerLabel}>{hostTriviaSurfaceCopy.answerLabel}</p>
      <p className={styles.answerValue}>{prompt.answer}</p>
    </div>
  </div>
);

// TRIVIA's host surface. At play it is a `<TakeoverStage>`
// (docs/takeover-layout-api.md §3): the body is a question card the host reads
// out, so there is nothing a floating chip could cover a corner of without
// covering a word.
//
// It renders no rail and no team chip of its own. `rail` arrives filled with
// the shell's `<HostMiniRail />`, which already says the round, the sauce and
// whose turn it is, and `activeTeamName` on the props is that same string
// resolved once by the shell — which is why this file no longer carries the
// `resolveActiveTeamName` helper that all nine host surfaces had copied.
export const HostTriviaSurface = ({
  phase,
  minigameHostView,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction
}: MinigameHostRendererProps): JSX.Element => {
  const triviaHostView = minigameHostView?.minigame === "TRIVIA" ? minigameHostView : null;
  const currentPrompt = triviaHostView?.currentPrompt ?? null;
  const attemptsRemaining = triviaHostView?.attemptsRemaining ?? 0;
  const attemptsExhausted = attemptsRemaining <= 0;

  // The intro phase already has the turn's first question, so the host gets a
  // look at it before play starts; only the TV is held back to "Get ready".
  // This beat is a panel in the control deck rather than a takeover — `rail`
  // and `clock` are both null on it — so it renders neither and lets the deck
  // hold the stack at its own content height.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introDescription}>
          {hostTriviaSurfaceCopy.introDescription}
        </p>
        {currentPrompt !== null && renderPromptCard(currentPrompt, styles.promptCard)}
      </div>
    );
  }

  const disableAttemptButtons =
    !canDispatchAction || attemptsExhausted || currentPrompt === null;
  // Once the turn is spent the count is the turn-complete panel's job to say,
  // and "0 questions left" beside it just says it twice.
  const shouldRenderQuestionsLeft = currentPrompt !== null && !attemptsExhausted;

  return (
    <TakeoverStage
      rail={rail}
      clock={clock}
      counter={
        shouldRenderQuestionsLeft ? (
          <p className={styles.counter}>
            {hostTriviaSurfaceCopy.questionsLeftLabel(attemptsRemaining)}
          </p>
        ) : null
      }
      actions={
        attemptsExhausted ? (
          <div className={styles.turnComplete}>
            <p className={styles.turnCompleteTitle}>
              {hostTriviaSurfaceCopy.turnCompleteTitle}
            </p>
            <p className={styles.turnCompleteHint}>
              {hostTriviaSurfaceCopy.turnCompleteHint}
            </p>
          </div>
        ) : (
          <div className={styles.actions}>
            {/* Positive verdict first (§4, owner decision P7). */}
            <button
              className={styles.correctButton}
              type="button"
              disabled={disableAttemptButtons}
              onClick={(): void => {
                onDispatchAction("recordAttempt", { isCorrect: true });
              }}
            >
              {hostTriviaSurfaceCopy.correctButtonLabel}
            </button>
            <button
              className={styles.incorrectButton}
              type="button"
              disabled={disableAttemptButtons}
              onClick={(): void => {
                onDispatchAction("recordAttempt", { isCorrect: false });
              }}
            >
              {hostTriviaSurfaceCopy.incorrectButtonLabel}
            </button>
          </div>
        )
      }
    >
      {/* A missing prompt means an empty bank, and that "waiting" note is only
          meaningful once play has started. */}
      {currentPrompt === null ? (
        <p className={styles.statusNote}>{hostTriviaSurfaceCopy.waitingPromptLabel}</p>
      ) : (
        renderPromptCard(
          currentPrompt,
          `${styles.promptCard} ${styles.promptCardFill}`
        )
      )}
    </TakeoverStage>
  );
};
