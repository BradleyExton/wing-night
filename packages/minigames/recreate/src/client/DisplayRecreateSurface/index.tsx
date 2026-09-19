import type { ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import {
  resolveContentAssetSrc,
  type RecreateAttempt,
  type RecreateMinigameDisplayView
} from "@wingnight/shared";

import { displayRecreateSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const CHECK_MARK = "✓";

const StudioShell = ({ children }: { children: ReactNode }): JSX.Element => (
  <div className={styles.stage}>
    <div className={styles.frameWall}>
      <header className={styles.header}>
        <p className={styles.headerTitle}>{displayRecreateSurfaceCopy.studioTitle}</p>
        <p className={styles.headerMeta}>{displayRecreateSurfaceCopy.studioSubtitle}</p>
      </header>
      {children}
    </div>
  </div>
);

const Picture = ({
  caption,
  imageSrc,
  alt,
  serverOrigin,
  placeholder = "",
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
    <figure className={styles.picture}>
      <div className={styles.pictureFrame}>
        {resolvedSrc !== null ? (
          <img className={styles.picturePhoto} src={resolvedSrc} alt={alt} />
        ) : (
          <div className={isBusy ? styles.picturePlaceholderBusy : styles.picturePlaceholder}>
            {placeholder}
          </div>
        )}
      </div>
      <figcaption className={styles.pictureCaption}>{caption}</figcaption>
    </figure>
  );
};

const resolveAttemptPlaceholder = (attempt: RecreateAttempt): string => {
  switch (attempt.status) {
    case "generating":
      return displayRecreateSurfaceCopy.attemptGeneratingLabel;
    case "failed":
      return displayRecreateSurfaceCopy.attemptFailedLabel;
    case "skipped":
      return displayRecreateSurfaceCopy.attemptSkippedLabel;
    case "ready":
      return "";
  }
};

const IngredientBoard = ({
  ingredients,
  checkedIngredientIndexes
}: Pick<RecreateMinigameDisplayView, "checkedIngredientIndexes"> & {
  ingredients: string[];
}): JSX.Element => (
  <ul className={styles.ingredients}>
    {ingredients.map((ingredient, ingredientIndex) => {
      const isChecked = checkedIngredientIndexes.includes(ingredientIndex);

      return (
        // Keyed by position, like the host's bench: an authored list is
        // allowed to say the same thing twice.
        <li
          key={`${ingredientIndex}-${ingredient}`}
          className={isChecked ? styles.ingredientChecked : styles.ingredient}
          data-recreate-ingredient={isChecked ? "checked" : "unchecked"}
        >
          <span className={styles.ingredientMark} aria-hidden="true">
            {isChecked ? CHECK_MARK : ""}
          </span>
          {ingredient}
        </li>
      );
    })}
  </ul>
);

const Appraisal = ({
  recreateDisplayView,
  activeTeamName
}: {
  recreateDisplayView: RecreateMinigameDisplayView;
  activeTeamName: string | null;
}): JSX.Element => {
  const { currentTarget, subState, attempt, ingredients, authoredPrompt, lastPointsAwarded } =
    recreateDisplayView;

  return (
    <div className={styles.appraisal}>
      <div className={styles.appraisalRow}>
        <p className={styles.title}>{currentTarget?.title ?? ""}</p>
        {subState === "writing" && activeTeamName !== null && (
          <p className={styles.status}>
            {displayRecreateSurfaceCopy.writingStatus(activeTeamName)}
          </p>
        )}
      </div>
      {subState === "writing" && (
        <p className={styles.sealed}>{displayRecreateSurfaceCopy.sealedIngredientsLabel}</p>
      )}
      {subState !== "writing" && attempt !== null && (
        <>
          <p className={styles.sectionLabel}>{displayRecreateSurfaceCopy.promptLabel}</p>
          <p className={styles.teamPrompt}>{attempt.prompt}</p>
        </>
      )}
      {ingredients !== null && (
        <>
          <p className={styles.sectionLabel}>{displayRecreateSurfaceCopy.ingredientsLabel}</p>
          <IngredientBoard
            ingredients={ingredients}
            checkedIngredientIndexes={recreateDisplayView.checkedIngredientIndexes}
          />
        </>
      )}
      {subState === "scored" && (
        <div className={styles.scoredRow}>
          <span className={styles.pointsSeal}>
            <span className={styles.pointsSealValue}>
              {displayRecreateSurfaceCopy.pointsSealValue(lastPointsAwarded ?? 0)}
            </span>
            <span className={styles.pointsSealLabel}>
              {displayRecreateSurfaceCopy.pointsSealLabel}
            </span>
          </span>
          {authoredPrompt !== null && (
            <div className={styles.reveal}>
              <p className={styles.sectionLabel}>
                {displayRecreateSurfaceCopy.authoredPromptLabel}
              </p>
              <p className={styles.revealPrompt}>{authoredPrompt}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DisplayRecreateSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  serverOrigin
}: MinigameDisplayRendererProps): JSX.Element => {
  const recreateDisplayView =
    minigameDisplayView?.minigame === "RECREATE" ? minigameDisplayView : null;
  const currentTarget = recreateDisplayView?.currentTarget ?? null;
  const isPlayPhase = phase === "play";

  if (!isPlayPhase || recreateDisplayView === null || currentTarget === null) {
    return (
      <StudioShell>
        <div className={styles.idleBody}>
          <p className={styles.idleText}>
            {isPlayPhase
              ? displayRecreateSurfaceCopy.waitingMessage
              : displayRecreateSurfaceCopy.introMessage}
          </p>
        </div>
      </StudioShell>
    );
  }

  const { attempt, subState } = recreateDisplayView;

  return (
    <StudioShell>
      <div className={styles.pictures}>
        <Picture
          caption={displayRecreateSurfaceCopy.targetCaption}
          imageSrc={currentTarget.targetImageSrc}
          alt={currentTarget.title}
          serverOrigin={serverOrigin}
        />
        {subState === "writing" ? (
          currentTarget.sourceImageSrc !== null && (
            <Picture
              caption={displayRecreateSurfaceCopy.originalCaption}
              imageSrc={currentTarget.sourceImageSrc}
              alt={currentTarget.title}
              serverOrigin={serverOrigin}
            />
          )
        ) : (
          <Picture
            caption={displayRecreateSurfaceCopy.attemptCaption}
            imageSrc={attempt?.imageSrc ?? null}
            alt={attempt?.prompt ?? currentTarget.title}
            serverOrigin={serverOrigin}
            placeholder={attempt === null ? "" : resolveAttemptPlaceholder(attempt)}
            isBusy={attempt?.status === "generating"}
          />
        )}
      </div>
      <Appraisal recreateDisplayView={recreateDisplayView} activeTeamName={activeTeamName} />
    </StudioShell>
  );
};
