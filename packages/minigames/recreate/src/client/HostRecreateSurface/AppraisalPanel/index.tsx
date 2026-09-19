import type { RecreateAttempt, RecreateChecklist } from "@wingnight/shared";
import type { MinigameActionDispatch } from "@wingnight/minigames-core";

import { hostRecreateSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

type AppraisalPanelProps = {
  attempt: RecreateAttempt;
  checklist: RecreateChecklist;
  pointsPerIngredient: number;
  canDispatchAction: boolean;
  onDispatchAction: MinigameActionDispatch;
};

const CHECK_MARK = "✓";

const resolveAttemptNote = (attempt: RecreateAttempt): string => {
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

// The host's grading bench: the team's prompt to read aloud, the secret
// ingredients as big toggles, and the lock. The picture is somewhere else on
// purpose — it never decides the score.
export const AppraisalPanel = ({
  attempt,
  checklist,
  pointsPerIngredient,
  canDispatchAction,
  onDispatchAction
}: AppraisalPanelProps): JSX.Element => {
  const checkedCount = checklist.checkedIngredientIndexes.length;

  return (
    <div className={styles.container}>
      <p className={styles.sectionLabel}>{hostRecreateSurfaceCopy.readAloudLabel}</p>
      <p className={styles.teamPrompt}>{attempt.prompt}</p>
      <p className={styles.attemptNote}>{resolveAttemptNote(attempt)}</p>
      <p className={styles.sectionLabel}>{hostRecreateSurfaceCopy.checklistLabel}</p>
      <ul className={styles.checklist}>
        {checklist.ingredients.map((ingredient, ingredientIndex) => {
          const isChecked = checklist.checkedIngredientIndexes.includes(ingredientIndex);

          return (
            <li key={ingredient}>
              <button
                className={isChecked ? styles.ingredientChecked : styles.ingredient}
                type="button"
                aria-pressed={isChecked}
                disabled={!canDispatchAction}
                onClick={(): void => {
                  onDispatchAction("toggleIngredient", { ingredientIndex });
                }}
              >
                <span className={styles.ingredientMark} aria-hidden="true">
                  {isChecked ? CHECK_MARK : ""}
                </span>
                {ingredient}
              </button>
            </li>
          );
        })}
      </ul>
      <p className={styles.tally}>
        {hostRecreateSurfaceCopy.tallyLabel(checkedCount * pointsPerIngredient)}
      </p>
      <div className={styles.actions}>
        <button
          className={styles.lockButton}
          type="button"
          disabled={!canDispatchAction}
          onClick={(): void => {
            onDispatchAction("lockScore", {});
          }}
        >
          {hostRecreateSurfaceCopy.lockButtonLabel}
        </button>
        <button
          className={styles.retryButton}
          type="button"
          disabled={!canDispatchAction}
          onClick={(): void => {
            onDispatchAction("retryPrompt", {});
          }}
        >
          {hostRecreateSurfaceCopy.retryButtonLabel}
        </button>
      </div>
    </div>
  );
};
