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
// ingredients as big toggles, and the running tally. The picture is somewhere
// else on purpose — it never decides the score.
//
// The lock and the redo hatch left with the migration: locking ends the beat,
// so it belongs in the takeover's foot row beside the other two beat-enders
// (docs/takeover-layout-api.md §4), and this panel is the thing the host reads
// while deciding rather than the thing they press to finish.
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
            // Keyed by position: an authored list is allowed to say the same
            // thing twice, and the tick follows the index either way.
            <li key={`${ingredientIndex}-${ingredient}`}>
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
    </div>
  );
};
