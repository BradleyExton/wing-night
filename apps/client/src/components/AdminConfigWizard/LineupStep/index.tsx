import {
  MINIGAME_TYPES,
  type GameConfigFile,
  type GameConfigRound,
  type MinigameType
} from "@wingnight/shared";

import { adminCopy } from "../../../copy/admin";
import { FieldIssue, hasFieldIssue } from "../FieldIssue";
import { parsePositiveInteger } from "../gameConfigDraft";
import type { IssueMessagesByPath } from "../selectIssueMessages";
import * as styles from "./styles";

// What a round with no max of its own is capped at: the scoring step's
// final-round max for the last round, its default for every other.
const resolveDefaultMinigameMax = (gameConfig: GameConfigFile, roundIndex: number): number => {
  return roundIndex === gameConfig.rounds.length - 1
    ? gameConfig.minigameScoring.finalRoundMax
    : gameConfig.minigameScoring.defaultMax;
};

type LineupStepProps = {
  gameConfig: GameConfigFile;
  issueMessagesByPath: IssueMessagesByPath;
  isLocked: boolean;
  onRoundChange: (roundIndex: number, edit: Partial<GameConfigRound>) => void;
  onAddRound: () => void;
  onRemoveRound: (roundIndex: number) => void;
};

// Matches the coordinates the shared validator reports: "rounds[1].sauce".
const roundFieldPath = (roundIndex: number, field: string): string =>
  `rounds[${roundIndex}].${field}`;

export const LineupStep = ({
  gameConfig,
  issueMessagesByPath,
  isLocked,
  onRoundChange,
  onAddRound,
  onRemoveRound
}: LineupStepProps): JSX.Element => {
  const invalidClassName = (path: string): string =>
    hasFieldIssue(issueMessagesByPath, path) ? styles.inputInvalid : "";

  return (
    <>
      {gameConfig.rounds.map((round, roundIndex) => (
        <article key={roundIndex} className={styles.roundCard}>
          <p className={styles.roundHead}>
            {adminCopy.roundLabel(round.round)}
            <button
              type="button"
              className={styles.removeButton}
              disabled={isLocked}
              aria-label={adminCopy.removeRoundLabel(round.round)}
              onClick={(): void => {
                onRemoveRound(roundIndex);
              }}
            >
              {adminCopy.removeRoundLabel(round.round)}
            </button>
          </p>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor={`admin-round-label-${roundIndex}`}
              >
                {adminCopy.roundLabelFieldLabel}
              </label>
              <input
                id={`admin-round-label-${roundIndex}`}
                className={`${styles.input} ${invalidClassName(
                  roundFieldPath(roundIndex, "label")
                )}`}
                value={round.label}
                disabled={isLocked}
                onChange={(event): void => {
                  onRoundChange(roundIndex, { label: event.target.value });
                }}
              />
              <FieldIssue
                messagesByPath={issueMessagesByPath}
                path={roundFieldPath(roundIndex, "label")}
              />
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor={`admin-round-sauce-${roundIndex}`}
              >
                {adminCopy.roundSauceFieldLabel}
              </label>
              <input
                id={`admin-round-sauce-${roundIndex}`}
                className={`${styles.input} ${invalidClassName(
                  roundFieldPath(roundIndex, "sauce")
                )}`}
                value={round.sauce}
                disabled={isLocked}
                onChange={(event): void => {
                  onRoundChange(roundIndex, { sauce: event.target.value });
                }}
              />
              <FieldIssue
                messagesByPath={issueMessagesByPath}
                path={roundFieldPath(roundIndex, "sauce")}
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{adminCopy.roundMinigameFieldLabel}</span>
              <span className={styles.chipRow}>
                {MINIGAME_TYPES.map((minigameType: MinigameType) => (
                  <button
                    key={minigameType}
                    type="button"
                    disabled={isLocked}
                    className={`${styles.chip} ${
                      round.minigame === minigameType ? styles.chipActive : ""
                    }`}
                    onClick={(): void => {
                      onRoundChange(roundIndex, { minigame: minigameType });
                    }}
                  >
                    {adminCopy.minigameName(minigameType)}
                  </button>
                ))}
              </span>
              <FieldIssue
                messagesByPath={issueMessagesByPath}
                path={roundFieldPath(roundIndex, "minigame")}
              />
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor={`admin-round-points-${roundIndex}`}
              >
                {adminCopy.roundPointsFieldLabel}
              </label>
              <input
                id={`admin-round-points-${roundIndex}`}
                className={`${styles.numberInput} ${invalidClassName(
                  roundFieldPath(roundIndex, "pointsPerPlayer")
                )}`}
                inputMode="numeric"
                value={round.pointsPerPlayer}
                disabled={isLocked}
                onChange={(event): void => {
                  onRoundChange(roundIndex, {
                    pointsPerPlayer: parsePositiveInteger(
                      event.target.value,
                      round.pointsPerPlayer
                    )
                  });
                }}
              />
              <FieldIssue
                messagesByPath={issueMessagesByPath}
                path={roundFieldPath(roundIndex, "pointsPerPlayer")}
              />
            </div>

            {/* Optional: blank keeps the scoring step's default (the final
                round's max for the last round), shown as the placeholder. */}
            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor={`admin-round-minigame-max-${roundIndex}`}
              >
                {adminCopy.roundMinigameMaxFieldLabel}
              </label>
              <input
                id={`admin-round-minigame-max-${roundIndex}`}
                className={`${styles.numberInput} ${invalidClassName(
                  roundFieldPath(roundIndex, "minigameMax")
                )}`}
                inputMode="numeric"
                value={round.minigameMax ?? ""}
                placeholder={String(resolveDefaultMinigameMax(gameConfig, roundIndex))}
                disabled={isLocked}
                onChange={(event): void => {
                  const rawValue = event.target.value.trim();

                  onRoundChange(roundIndex, {
                    minigameMax:
                      rawValue === ""
                        ? undefined
                        : parsePositiveInteger(
                            rawValue,
                            round.minigameMax ??
                              resolveDefaultMinigameMax(gameConfig, roundIndex)
                          )
                  });
                }}
              />
              <FieldIssue
                messagesByPath={issueMessagesByPath}
                path={roundFieldPath(roundIndex, "minigameMax")}
              />
            </div>
          </div>
        </article>
      ))}

      <button
        type="button"
        className={styles.addRowButton}
        disabled={isLocked}
        onClick={onAddRound}
      >
        {adminCopy.addRoundLabel}
      </button>
    </>
  );
};
