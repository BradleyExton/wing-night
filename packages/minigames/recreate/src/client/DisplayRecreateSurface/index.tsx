import type { ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { NeonMarquee, ResultPlaque } from "@wingnight/surface";
import {
  resolveContentAssetSrc,
  type RecreateAttempt,
  type RecreateMinigameDisplayView
} from "@wingnight/shared";

import { resolveRecreateTargetNumber } from "../resolveRecreateTargetNumber/index.js";
import { displayRecreateSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const CHECK_MARK = "✓";

const StudioShell = ({
  children,
  activeTeamName,
  readout,
  clock,
  clockLine
}: {
  children: ReactNode;
  activeTeamName: string | null;
  // "Target 1 / 2" — the wall's wording, as SCHLONIC's is "Run 1 / 3" to the
  // tablet's "of". Null before a view has arrived.
  readout: string | null;
  clock: ReactNode;
  clockLine: ReactNode;
}): JSX.Element => (
  <div className={styles.stage}>
    <div className={styles.frameWall}>
      <NeonMarquee
        title={displayRecreateSurfaceCopy.title}
        teamName={activeTeamName}
        readout={readout}
        clock={clock}
        clockLine={clockLine}
      />
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
          <ResultPlaque
            tone={(lastPointsAwarded ?? 0) > 0 ? "hit" : "miss"}
            kicker={displayRecreateSurfaceCopy.appraisalKicker}
            title={displayRecreateSurfaceCopy.appraisalTitle(
              recreateDisplayView.checkedIngredientIndexes.length,
              ingredients?.length ?? 0
            )}
            points={displayRecreateSurfaceCopy.pointsValue(lastPointsAwarded ?? 0)}
            pointsCaption={displayRecreateSurfaceCopy.pointsCaption}
          />
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
  clock,
  clockLine,
  serverOrigin
}: MinigameDisplayRendererProps): JSX.Element => {
  const recreateDisplayView =
    minigameDisplayView?.minigame === "RECREATE" ? minigameDisplayView : null;
  const currentTarget = recreateDisplayView?.currentTarget ?? null;
  const isPlayPhase = phase === "play";

  if (!isPlayPhase || recreateDisplayView === null || currentTarget === null) {
    return (
      <StudioShell
        activeTeamName={activeTeamName}
        readout={null}
        clock={clock}
        clockLine={clockLine}
      >
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
  const targetReadout = displayRecreateSurfaceCopy.targetCounter(
    resolveRecreateTargetNumber(
      subState,
      recreateDisplayView.targetsCompletedThisTurn,
      recreateDisplayView.targetsPerTurn
    ),
    recreateDisplayView.targetsPerTurn
  );

  return (
    <StudioShell
      activeTeamName={activeTeamName}
      readout={targetReadout}
      clock={clock}
      clockLine={clockLine}
    >
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
